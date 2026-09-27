import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Appointment } from '../appointments/appointment.entity';
import { PassportController } from './passport.controller';
import { Passport } from './passport.entity';
import { PassportService } from './passport.service';

@Module({ imports: [TypeOrmModule.forFeature([Passport, Appointment]), AuthModule], controllers: [PassportController], providers: [PassportService] })
export class PassportModule {}
