import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { AuthModule } from '../auth/auth.module';
import { Notification } from './notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushSubscription } from './push-subscription.entity';
import { PushService } from './push.service';

@Module({ imports: [TypeOrmModule.forFeature([Notification, User, PushSubscription]), AuthModule], controllers: [NotificationController], providers: [NotificationService, PushService], exports: [NotificationService, PushService] })
export class NotificationModule {}
