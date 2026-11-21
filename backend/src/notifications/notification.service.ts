import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../auth/user.entity";
import { Appointment } from "../appointments/appointment.entity";
import { Notification, NotificationChannel } from "./notification.entity";
import { Salon } from "../salon/salon.entity";
import { WhatsAppService } from "./whatsapp.service";
import { SendWhatsAppDto } from "./whatsapp.dto";
import { BadRequestException } from "@nestjs/common";
import { MobilePushService } from "./mobile-push.service";
import { PushService } from "./push.service";

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Salon) private readonly salons: Repository<Salon>,
    private readonly whatsapp: WhatsAppService,
    private readonly mobilePush: MobilePushService,
    private readonly webPush: PushService,
  ) {}

  private reminderTimer?: NodeJS.Timeout;
  onModuleInit() {
    this.reminderTimer = setInterval(
      () => void this.queueUpcomingReminders(),
      5 * 60 * 1000,
    );
  }
  onModuleDestroy() {
    if (this.reminderTimer) clearInterval(this.reminderTimer);
  }

  async queueForAppointment(appointment: Appointment, event: string) {
    const user = appointment.guestEmail
      ? await this.users.findOne({ where: { email: appointment.guestEmail } })
      : null;
    const recipientPhone = appointment.guestPhone || user?.phone || null;
    const salon = await this.salons.findOne({
      where: { id: appointment.salonId },
      select: ["id", "name"],
    });
    const preferences = user?.notificationPreferences || {
      email: true,
      whatsapp: true,
      appointmentReminders: true,
    };
    if (
      event.startsWith("appointment.reminder") &&
      (preferences as { appointmentReminders?: boolean })
        .appointmentReminders === false
    )
      return [];
    const channels = (["email", "whatsapp"] as NotificationChannel[]).filter(
      (channel) =>
        channel === "email"
          ? Boolean(appointment.guestEmail && preferences.email)
          : recipientPhone &&
            preferences.whatsapp !== false &&
            this.whatsapp.isConfigured(),
    );
    const records = await Promise.all(
      channels.map(async (channel) => {
        const existing = await this.repo.findOne({
          where: { appointmentId: appointment.id, event, channel },
        });
        if (existing) {
          if (!existing.recipientPhone && recipientPhone) {
            existing.recipientPhone = recipientPhone;
            existing.status = "Queued";
            existing.lastError = null;
          }
          return this.repo.save(existing);
        }
        return this.repo.save(
          this.repo.create({
            salonId: appointment.salonId,
            appointmentId: appointment.id,
            recipientEmail: appointment.guestEmail,
            recipientPhone,
            channel,
            event,
            payload: {
              service: appointment.service,
              date: appointment.date,
              time: appointment.time,
              stylist: appointment.stylist,
              status: appointment.status,
              salonName: salon?.name || "Halo Salon",
            },
            status: "Queued",
            attempts: 0,
            maxAttempts: 3,
            providerMessageId: null,
            lastError: null,
            scheduledAt: null,
            sentAt: null,
          }),
        );
      }),
    );
    await Promise.all(records.map((record) => this.deliver(record.id)));
    const admins = await this.users.find({
      where: { salonId: appointment.salonId, role: UserRole.ADMIN, active: true },
      select: ["id", "notificationPreferences"],
    });
    const platformAdmins = await this.users.find({
      where: { role: UserRole.PLATFORM_ADMIN, active: true },
      select: ["id", "notificationPreferences"],
    });
    const recipientUserIds = [
      ...(user?.id && user.notificationPreferences?.push !== false ? [user.id] : []),
      ...(event === "appointment.created" || event.includes("cancelled") ||
      event.includes("rescheduled") || event.includes("reminder") ||
      event.includes("completed")
        ? [
            ...admins.filter((admin) => admin.notificationPreferences?.push !== false),
            ...platformAdmins.filter((admin) => admin.notificationPreferences?.push !== false),
          ].map((admin) => admin.id)
        : []),
    ];
    const action = event.replace("appointment.", "");
    void this.mobilePush
      .notifyUsers({
        recipientUserIds,
        salonId: appointment.salonId,
        notificationType: event,
        title: action.startsWith("reminder") ? "Appointment reminder" : "Appointment update",
        message: `${appointment.service || "Your salon appointment"} is ${appointment.status.toLowerCase()}${appointment.date ? ` on ${appointment.date}` : ""}${appointment.time ? ` at ${appointment.time}` : ""}.`,
        relatedEntityId: appointment.id,
        payload: { url: "/(tabs)/appointments", appointmentId: appointment.id, event },
      })
      .catch((error) => this.logger.warn(`Mobile push failed: ${error instanceof Error ? error.message : "unknown error"}`));
    void Promise.all(
      recipientUserIds.map((recipientUserId) =>
        this.webPush.send(
          recipientUserId,
          action.startsWith("reminder") ? "Appointment reminder" : "Appointment update",
          `${appointment.service || "Your salon appointment"} is ${appointment.status.toLowerCase()}.`,
          "/appointments",
        ),
      ),
    ).catch((error) => this.logger.warn(`Web push failed: ${error instanceof Error ? error.message : "unknown error"}`));
    return records;
  }

  async list(email: string, isAdmin: boolean, salonId?: string) {
    return this.repo.find({
      where: isAdmin
        ? { salonId: salonId || undefined }
        : { recipientEmail: email, salonId: salonId || undefined },
      order: { createdAt: "DESC" },
    });
  }

  async sendManualWhatsApp(dto: SendWhatsAppDto, salonId: string) {
    if (!this.whatsapp.isConfigured())
      throw new BadRequestException("WhatsApp notifications are not configured");
    const record = await this.repo.save(
      this.repo.create({
        salonId,
        appointmentId: null,
        recipientEmail: "",
        recipientPhone: dto.recipientPhone,
        channel: "whatsapp",
        event: `manual.${dto.subject?.trim() || "message"}`.slice(0, 160),
        payload: { message: dto.message, subject: dto.subject || null },
        status: "Queued",
        attempts: 0,
        maxAttempts: 3,
        providerMessageId: null,
        lastError: null,
        scheduledAt: null,
        sentAt: null,
      }),
    );
    return this.deliver(record.id, salonId);
  }

  async applyWhatsAppStatuses(
    statuses: Array<{ id?: string; status?: string; errors?: unknown }>,
  ) {
    let updated = 0;
    for (const status of statuses) {
      if (!status.id) continue;
      const item = await this.repo.findOne({
        where: { providerMessageId: status.id },
      });
      if (!item) continue;
      const nextStatus: Notification["status"] =
        status.status === "read"
          ? "Read"
          : status.status === "delivered"
            ? "Delivered"
            : status.status === "failed"
              ? "Failed"
              : "Sent";
      item.status = nextStatus;
      if (nextStatus === "Failed")
        item.lastError = JSON.stringify(status.errors || "WhatsApp delivery failed");
      await this.repo.save(item);
      updated += 1;
    }
    return updated;
  }

  async deliver(id: string, salonId?: string) {
    const item = await this.repo.findOne({
      where: { id, ...(salonId ? { salonId } : {}) },
    });
    if (!item) throw new NotFoundException("Notification not found");
    item.attempts += 1;
    try {
      const webhook =
        process.env[`NOTIFICATION_${item.channel.toUpperCase()}_WEBHOOK_URL`];
      let providerMessageId: string | null = null;
      if (
        item.channel === "email" &&
        process.env.EMAIL_REMINDERS_ENABLED !== "false"
      ) {
        if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
          throw new Error("Resend email configuration is missing");
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [item.recipientEmail],
            subject: `Halo Salon appointment ${item.event.replace("appointment.", "")}`,
            html: `<p>Your appointment for <strong>${String(item.payload.service || "salon service")}</strong> is ${String(item.payload.status || "scheduled")}.</p><p>${String(item.payload.date || "")} at ${String(item.payload.time || "")} with ${String(item.payload.stylist || "your stylist")}.</p>`,
          }),
        });
        if (!response.ok) throw new Error(`Resend returned ${response.status}`);
        const result = (await response.json()) as { id?: string };
        providerMessageId = result.id || null;
      } else if (item.channel === "whatsapp") {
        providerMessageId = item.payload.message
          ? await this.whatsapp.sendText(
              item.recipientPhone || "",
              String(item.payload.message),
            )
          : await this.whatsapp.sendAppointmentTemplate(item.recipientPhone || "", [
            String(item.payload.salonName || "Halo Salon"),
            String(item.payload.service || "salon service"),
            String(item.payload.date || ""),
            String(item.payload.time || ""),
            String(item.payload.stylist || "your stylist"),
          ]);
      } else if (webhook) {
        const response = await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            to: item.recipientEmail,
            channel: item.channel,
            event: item.event,
            payload: item.payload,
          }),
        });
        if (!response.ok)
          throw new Error(`Notification provider returned ${response.status}`);
      }
      item.status = "Sent";
      item.providerMessageId =
        providerMessageId ||
        `${webhook ? "provider" : "local"}-${item.channel}-${Date.now()}`;
      item.sentAt = new Date();
      item.lastError = null;
    } catch (error) {
      item.status = item.attempts >= item.maxAttempts ? "Failed" : "Queued";
      item.lastError =
        error instanceof Error ? error.message : "Notification provider failed";
      this.logger.warn(
        `Notification ${item.id} delivery failed: ${item.lastError}`,
      );
    }
    return this.repo.save(item);
  }

  private async queueUpcomingReminders() {
    const now = new Date();
    const timezone = process.env.SALON_TIMEZONE || "Asia/Kolkata";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
    const currentMinutes = value("hour") * 60 + value("minute");
    const today = `${value("year")}-${String(value("month")).padStart(2, "0")}-${String(value("day")).padStart(2, "0")}`;
    const tomorrowDate = new Date(`${today}T12:00:00Z`);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);
    const appointments = await this.users.manager
      .getRepository(Appointment)
      .find({ where: [{ date: today, status: "Confirmed" }, { date: tomorrow, status: "Confirmed" }] });
    for (const appointment of appointments) {
      const match = String(appointment.time || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) continue;
      let hour = Number(match[1]);
      const minute = Number(match[2]);
      if (match[3]?.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (match[3]?.toUpperCase() === "AM" && hour === 12) hour = 0;
      const appointmentMinutes = hour * 60 + minute;
      const minutesUntil = appointment.date === today
        ? appointmentMinutes - currentMinutes
        : appointmentMinutes - currentMinutes + 24 * 60;
      if (Math.abs(minutesUntil - 60) <= 5)
        await this.queueForAppointment(appointment, "appointment.reminder1h");
      if (Math.abs(minutesUntil - 24 * 60) <= 5)
        await this.queueForAppointment(appointment, "appointment.reminder24h");
    }
  }
}
