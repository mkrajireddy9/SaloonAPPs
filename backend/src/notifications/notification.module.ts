import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { AuthModule } from '../auth/auth.module';
import { Notification } from './notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({ imports: [TypeOrmModule.forFeature([Notification, User]), AuthModule], controllers: [NotificationController], providers: [NotificationService], exports: [NotificationService] })
export class NotificationModule {}
