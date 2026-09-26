import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Appointment } from '../appointments/appointment.entity';
import { Consultation } from '../consultations/consultation.entity';
import { Salon } from '../salon/salon.entity';
import { User } from '../auth/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({ imports: [TypeOrmModule.forFeature([Appointment, Consultation, User, Salon]), AuthModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
