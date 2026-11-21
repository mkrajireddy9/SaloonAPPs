import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { UserRole } from "../auth/user.entity";
import { RegisterMobilePushDto } from "./mobile-push.dto";
import { DevicePushToken } from "./device-push-token.entity";
import { UserNotification } from "./user-notification.entity";

type MobileNotificationInput = {
  recipientUserIds: string[];
  salonId?: string | null;
  notificationType: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  relatedEntityId?: string;
};

@Injectable()
export class MobilePushService {
  private readonly logger = new Logger(MobilePushService.name);

  constructor(
    @InjectRepository(DevicePushToken)
    private readonly tokens: Repository<DevicePushToken>,
    @InjectRepository(UserNotification)
    private readonly notifications: Repository<UserNotification>,
  ) {}

  async register(userId: string, salonId: string | null | undefined, dto: RegisterMobilePushDto) {
    if (!/^Expo(nent)?PushToken\[.+\]$/.test(dto.expoPushToken)) {
      throw new BadRequestException("Invalid Expo push token");
    }
    let token = await this.tokens.findOne({ where: { expoPushToken: dto.expoPushToken } });
    if (!token) token = this.tokens.create({ expoPushToken: dto.expoPushToken });
    token.userId = userId;
    token.salonId = salonId || null;
    token.deviceType = dto.deviceType;
    token.isActive = true;
    token.lastError = null;
    token.lastUsedAt = new Date();
    return this.tokens.save(token);
  }

  async unregister(userId: string, expoPushToken?: string) {
    const where = expoPushToken ? { userId, expoPushToken } : { userId };
    await this.tokens.update(where, { isActive: false });
    return { enabled: false };
  }

  async notifyUsers(input: MobileNotificationInput) {
    const recipientUserIds = [...new Set(input.recipientUserIds.filter(Boolean))];
    if (!recipientUserIds.length) return { notifications: 0, sent: 0 };
    let historyCount = 0;
    for (const recipientUserId of recipientUserIds) {
      const existing = input.relatedEntityId
        ? await this.notifications.findOne({
            where: {
              recipientUserId,
              notificationType: input.notificationType,
              relatedEntityId: input.relatedEntityId,
            },
          })
        : null;
      if (!existing) {
        await this.notifications.save(
          this.notifications.create({
            recipientUserId,
            salonId: input.salonId || null,
            notificationType: input.notificationType,
            title: input.title,
            message: input.message,
            payload: input.payload || {},
            relatedEntityId: input.relatedEntityId || null,
            sentAt: null,
            isRead: false,
          }),
        );
        historyCount += 1;
      }
    }

    const activeTokens = await this.tokens.find({
      where: { userId: In(recipientUserIds), isActive: true },
    });
    if (!activeTokens.length) return { notifications: historyCount, sent: 0 };
    let sent = 0;
    for (let index = 0; index < activeTokens.length; index += 100) {
      const batch = activeTokens.slice(index, index + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          batch.map((token) => ({
            to: token.expoPushToken,
            title: input.title,
            body: input.message,
            data: input.payload || {},
            sound: "default",
            channelId: "default",
          })),
        ),
      });
      if (!response.ok) throw new Error(`Expo Push API returned ${response.status}`);
      const result = (await response.json()) as {
        data?: Array<{ status?: string; id?: string; message?: string; details?: { error?: string } }>;
      };
      const tickets = result.data || [];
      for (let i = 0; i < batch.length; i += 1) {
        const ticket = tickets[i];
        const token = batch[i];
        if (ticket?.status === "ok") {
          token.lastTicketId = ticket.id || null;
          token.lastError = null;
          token.lastUsedAt = new Date();
          sent += 1;
        } else {
          token.lastError = ticket?.message || "Expo rejected the notification";
          if (ticket?.details?.error === "DeviceNotRegistered") token.isActive = false;
        }
      }
      await this.tokens.save(batch);
      const successfulUserIds = [...new Set(batch.filter((token) => token.lastTicketId).map((token) => token.userId))];
      if (successfulUserIds.length && input.relatedEntityId) {
        await this.notifications.update(
          { recipientUserId: In(successfulUserIds), relatedEntityId: input.relatedEntityId, notificationType: input.notificationType },
          { sentAt: new Date() },
        );
      }
      const ticketIds = tickets.filter((ticket) => ticket?.status === "ok" && ticket.id).map((ticket) => ticket.id as string);
      if (ticketIds.length) setTimeout(() => void this.processReceipts(ticketIds), 10_000);
    }
    return { notifications: historyCount, sent };
  }

  async listForUser(userId: string, role: UserRole, salonId?: string | null) {
    const notifications = await this.notifications.find({
      where: { recipientUserId: userId, ...(role === UserRole.ADMIN && salonId ? { salonId } : {}) },
      order: { createdAt: "DESC" },
      take: 100,
    });
    return notifications;
  }

  async unreadCount(userId: string) {
    return this.notifications.count({ where: { recipientUserId: userId, isRead: false } });
  }

  async markRead(userId: string, id: string) {
    await this.notifications.update({ id, recipientUserId: userId }, { isRead: true });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notifications.update({ recipientUserId: userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  private async processReceipts(ticketIds: string[]) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: ticketIds }),
      });
      if (!response.ok) return;
      const result = (await response.json()) as { data?: Record<string, { status?: string; message?: string; details?: { error?: string } }> };
      for (const [ticketId, receipt] of Object.entries(result.data || {})) {
        const token = await this.tokens.findOne({ where: { lastTicketId: ticketId } });
        if (!token) continue;
        token.lastError = receipt.status === "ok" ? null : receipt.message || "Expo receipt failed";
        if (receipt.details?.error === "DeviceNotRegistered") token.isActive = false;
        await this.tokens.save(token);
      }
    } catch (error) {
      this.logger.warn(`Expo receipt processing failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
}
