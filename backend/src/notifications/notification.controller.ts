import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UserRole } from '../auth/user.entity';
import { NotificationService } from './notification.service';

@Controller('notifications') @ApiTags('notifications') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}
  @Get() @ApiOperation({ summary: 'List notification delivery records' }) list(@Req() request: { user: { email: string; role: UserRole; salonId?: string } }) { return this.service.list(request.user.email, request.user.role === UserRole.ADMIN, request.user.salonId); }
  @Post(':id/retry') @ApiOperation({ summary: 'Retry a notification delivery' }) retry(@Param('id') id: string) { return this.service.deliver(id); }
}
