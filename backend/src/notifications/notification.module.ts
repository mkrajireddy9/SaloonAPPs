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

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, PushSubscription, Salon]),
    AuthModule,
  ],
  controllers: [NotificationController, WhatsAppWebhookController],
  providers: [NotificationService, PushService, WhatsAppService],
  exports: [NotificationService, PushService],
})
export class NotificationModule {}
