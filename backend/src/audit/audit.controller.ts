import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user.entity';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly service: AuditService) {}
  @Get('logs') list(@Query() query: { actorEmail?: string; from?: string; to?: string; page?: number; pageSize?: number }) { return this.service.list(query); }
}
