import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultation.entity';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';

@Module({ imports: [TypeOrmModule.forFeature([Consultation])], controllers: [ConsultationController], providers: [ConsultationService] })
export class ConsultationModule {}
