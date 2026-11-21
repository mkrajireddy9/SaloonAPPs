import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/user.entity";
import { AuthModule } from "../auth/auth.module";
import { Notification } from "./notification.entity";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { PushSubscription } from "./push-subscription.entity";
import { PushService } from "./push.service";
import { WhatsAppService } from "./whatsapp.service";
import { Salon } from "../salon/salon.entity";
import { WhatsAppWebhookController } from "./whatsapp-webhook.controller";
import { DevicePushToken } from "./device-push-token.entity";
import { UserNotification } from "./user-notification.entity";
import { MobilePushService } from "./mobile-push.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      User,
      PushSubscription,
      Salon,
      DevicePushToken,
      UserNotification,
    ]),
    AuthModule,
  ],
  controllers: [NotificationController, WhatsAppWebhookController],
  providers: [NotificationService, PushService, WhatsAppService, MobilePushService],
  exports: [NotificationService, PushService, MobilePushService],
})
export class NotificationModule {}
