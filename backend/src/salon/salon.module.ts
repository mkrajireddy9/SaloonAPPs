import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SalonController } from './salon.controller';
import { Salon } from './salon.entity';
import { SalonService } from './salon.service';

@Module({ imports: [TypeOrmModule.forFeature([Salon]), AuthModule], controllers: [SalonController], providers: [SalonService] })
export class SalonModule {}
