import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultations/consultation.entity';
import { ConsultationModule } from './consultations/consultation.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL, autoLoadEntities: true, synchronize: true }), ConsultationModule],
})
export class AppModule {}
