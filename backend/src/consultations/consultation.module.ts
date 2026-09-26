import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultation.entity';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';

@Module({ imports: [TypeOrmModule.forFeature([Consultation]), AuthModule, AiModule], controllers: [ConsultationController], providers: [ConsultationService] })
export class ConsultationModule {}
