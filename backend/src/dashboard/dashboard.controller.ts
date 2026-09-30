import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get('summary') @ApiOperation({ summary: 'Get filterable admin dashboard metrics, revenue, and operational reports' }) summary(@Query() query: { dateFrom?: string; dateTo?: string; branchId?: string; service?: string; stylist?: string; status?: string }, @Req() request: { user: { salonId?: string } }) { return this.service.summary(query, request.user.salonId); }
}
