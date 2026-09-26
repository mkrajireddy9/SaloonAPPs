import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultations/consultation.entity';
import { ConsultationModule } from './consultations/consultation.module';
import { Appointment } from './appointments/appointment.entity';
import { AppointmentModule } from './appointments/appointment.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { Salon } from './salon/salon.entity';
import { SalonModule } from './salon/salon.module';
import { Passport } from './passport/passport.entity';
import { PassportModule } from './passport/passport.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InitialSchema1710000000000 } from './database/migrations/1710000000000-InitialSchema';
import { ConsultationImages1720000000000 } from './database/migrations/1720000000000-ConsultationImages';
import { SalonHours1730000000000 } from './database/migrations/1730000000000-SalonHours';
import { AiModule } from './ai/ai.module';
import { resolve } from 'path';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')] }), TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL, entities: [Consultation, Appointment, User, Salon, Passport], migrations: [InitialSchema1710000000000, ConsultationImages1720000000000, SalonHours1730000000000], migrationsRun: true, synchronize: false }), ConsultationModule, AppointmentModule, AuthModule, SalonModule, PassportModule, DashboardModule, AiModule],
})
export class AppModule {}
