import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Salon } from '../salon/salon.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [TypeOrmModule.forFeature([Appointment, Salon]), AuthModule], controllers: [AppointmentController], providers: [AppointmentService] })
export class AppointmentModule {}
