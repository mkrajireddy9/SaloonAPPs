import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/user.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({ imports: [TypeOrmModule.forFeature([User, Appointment]), AuthModule], controllers: [CustomerController], providers: [CustomerService] })
export class CustomerModule {}
