import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Notification, NotificationChannel } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>, @InjectRepository(User) private readonly users: Repository<User>) {}

  async queueForAppointment(appointment: Appointment, event: string) {
    if (!appointment.guestEmail) return [];
    const user = await this.users.findOne({ where: { email: appointment.guestEmail } });
    const preferences = user?.notificationPreferences || { email: true, sms: false, whatsapp: false };
    const channels = (Object.keys(preferences) as NotificationChannel[]).filter(channel => preferences[channel]);
    const records = await Promise.all(channels.map(channel => this.repo.save(this.repo.create({ appointmentId: appointment.id, recipientEmail: appointment.guestEmail, channel, event, payload: { service: appointment.service, date: appointment.date, time: appointment.time, stylist: appointment.stylist, status: appointment.status }, status: 'Queued', attempts: 0, maxAttempts: 3, providerMessageId: null, lastError: null, scheduledAt: null, sentAt: null }))));
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
      if (webhook) {
        const response = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: item.recipientEmail, channel: item.channel, event: item.event, payload: item.payload }) });
        if (!response.ok) throw new Error(`Notification provider returned ${response.status}`);
      }
      item.status = 'Sent';
      item.providerMessageId = `${webhook ? 'provider' : 'local'}-${item.channel}-${Date.now()}`;
      item.sentAt = new Date();
      item.lastError = null;
    } catch (error) {
      item.status = item.attempts >= item.maxAttempts ? 'Failed' : 'Queued';
      item.lastError = error instanceof Error ? error.message : 'Notification provider failed';
    }
    return this.repo.save(item);
  }
}
