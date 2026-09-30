import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Notification, NotificationChannel } from './notification.entity';

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>, @InjectRepository(User) private readonly users: Repository<User>) {}

  private reminderTimer?: NodeJS.Timeout;
  onModuleInit() { this.reminderTimer = setInterval(() => void this.queueUpcomingReminders(), 5 * 60 * 1000); }
  onModuleDestroy() { if (this.reminderTimer) clearInterval(this.reminderTimer); }

  async queueForAppointment(appointment: Appointment, event: string) {
    if (!appointment.guestEmail && !appointment.guestPhone) return [];
    const user = await this.users.findOne({ where: { email: appointment.guestEmail } });
    const recipientPhone = appointment.guestPhone || user?.phone || null;
    const preferences = user?.notificationPreferences || { email: true, sms: false, whatsapp: false };
    const channels = (Object.keys(preferences) as NotificationChannel[]).filter(channel => preferences[channel]);
    const records = await Promise.all(channels.map(async channel => {
      const existing = await this.repo.findOne({ where: { appointmentId: appointment.id, event, channel } });
      if (existing) { if (!existing.recipientPhone && recipientPhone) { existing.recipientPhone = recipientPhone; existing.status = 'Queued'; existing.lastError = null; } return this.repo.save(existing); }
      return this.repo.save(this.repo.create({ appointmentId: appointment.id, recipientEmail: appointment.guestEmail, recipientPhone, channel, event, payload: { service: appointment.service, date: appointment.date, time: appointment.time, stylist: appointment.stylist, status: appointment.status }, status: 'Queued', attempts: 0, maxAttempts: 3, providerMessageId: null, lastError: null, scheduledAt: null, sentAt: null }));
    }));
    await Promise.all(records.map(record => this.deliver(record.id)));
    return records;
  }

  async list(email: string, isAdmin: boolean) { return this.repo.find({ where: isAdmin ? {} : { recipientEmail: email }, order: { createdAt: 'DESC' } }); }

  async deliver(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Notification not found');
    item.attempts += 1;
    try {
      const webhook = process.env[`NOTIFICATION_${item.channel.toUpperCase()}_WEBHOOK_URL`];
      if (item.channel === 'whatsapp' && process.env.WHATSAPP_ENABLED !== 'true') { item.status = 'Queued'; item.lastError = 'WhatsApp reminders are disabled'; return this.repo.save(item); }
      let providerMessageId: string | null = null;
      if (item.channel === 'email' && process.env.EMAIL_REMINDERS_ENABLED !== 'false') {
        if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Resend email configuration is missing');
        const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [item.recipientEmail], subject: `Halo Salon appointment ${item.event.replace('appointment.', '')}`, html: `<p>Your appointment for <strong>${String(item.payload.service || 'salon service')}</strong> is ${String(item.payload.status || 'scheduled')}.</p><p>${String(item.payload.date || '')} at ${String(item.payload.time || '')} with ${String(item.payload.stylist || 'your stylist')}.</p>` }) });
        if (!response.ok) throw new Error(`Resend returned ${response.status}`);
        const result = await response.json() as { id?: string };
        providerMessageId = result.id || null;
      } else if (item.channel === 'sms' || item.channel === 'whatsapp') {
        if (!item.recipientPhone) throw new Error('A phone number is required for SMS or WhatsApp notifications');
        if (item.channel === 'sms' && process.env.SMS_ENABLED !== 'true') { item.status = 'Queued'; item.lastError = 'SMS reminders are disabled'; return this.repo.save(item); }
        if (item.channel === 'whatsapp' && process.env.WHATSAPP_ENABLED !== 'true') { item.status = 'Queued'; item.lastError = 'WhatsApp reminders are disabled'; return this.repo.save(item); }
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const from = item.channel === 'whatsapp' ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;
        if (!accountSid || !authToken || !from) throw new Error(`${item.channel} provider configuration is missing`);
        const message = `Halo Salon: your ${item.payload.service || 'appointment'} is ${item.payload.status || 'scheduled'} on ${item.payload.date || ''} at ${item.payload.time || ''}.`;
        const contentSid = item.channel === 'whatsapp' ? process.env.TWILIO_WHATSAPP_CONTENT_SID : process.env.TWILIO_SMS_CONTENT_SID;
        const body = new URLSearchParams({ To: item.channel === 'whatsapp' ? `whatsapp:${item.recipientPhone}` : item.recipientPhone, From: from, ...(contentSid ? { ContentSid: contentSid, ContentVariables: JSON.stringify({ '1': String(item.payload.service || 'appointment'), '2': String(item.payload.date || ''), '3': String(item.payload.time || ''), '4': String(item.payload.status || 'scheduled') }) } : { Body: message }) });
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, { method: 'POST', headers: { authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' }, body });
        const result = await response.json() as { sid?: string; message?: string; code?: number };
        if (!response.ok) throw new Error(`Twilio returned ${response.status}: ${result.message || 'delivery failed'}`);
        providerMessageId = result.sid || null;
      } else if (webhook) {
        const response = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: item.recipientEmail, channel: item.channel, event: item.event, payload: item.payload }) });
        if (!response.ok) throw new Error(`Notification provider returned ${response.status}`);
      }
      item.status = 'Sent';
      item.providerMessageId = providerMessageId || `${webhook ? 'provider' : 'local'}-${item.channel}-${Date.now()}`;
      item.sentAt = new Date();
      item.lastError = null;
    } catch (error) {
      item.status = item.attempts >= item.maxAttempts ? 'Failed' : 'Queued';
      item.lastError = error instanceof Error ? error.message : 'Notification provider failed';
      this.logger.warn(`Notification ${item.id} delivery failed: ${item.lastError}`);
    }
    return this.repo.save(item);
  }

  private async queueUpcomingReminders() {
    if (process.env.EMAIL_REMINDERS_ENABLED === 'false') return;
    const date = new Date();
    const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const appointments = await this.users.manager.getRepository(Appointment).find({ where: { date: tomorrow, status: 'Confirmed' } });
    for (const appointment of appointments) await this.queueForAppointment(appointment, 'appointment.reminder');
  }
}
