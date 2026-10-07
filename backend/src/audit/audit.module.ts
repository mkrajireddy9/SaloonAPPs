import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLog } from './audit.entity';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({ imports: [TypeOrmModule.forFeature([AuditLog]), AuthModule], controllers: [AuditController], providers: [AuditService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }], exports: [AuditService] })
export class AuditModule {}
