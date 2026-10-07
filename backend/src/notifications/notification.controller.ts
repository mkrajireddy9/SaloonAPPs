import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UserRole } from '../auth/user.entity';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { PushSubscriptionDto } from './push-subscription.dto';

@Controller('notifications') @ApiTags('notifications') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService, private readonly push: PushService) {}
  @Post('push/subscribe') @ApiOperation({ summary: 'Register the authenticated browser for push notifications' }) subscribe(@Body() dto: PushSubscriptionDto, @Req() request: { user: { sub: string }; headers: { 'user-agent'?: string } }) { return this.push.subscribe(request.user.sub, dto, request.headers['user-agent']); }
  @Post('push/unsubscribe') @ApiOperation({ summary: 'Disable push notifications for one browser' }) unsubscribe(@Body() dto: PushSubscriptionDto, @Req() request: { user: { sub: string } }) { return this.push.unsubscribe(request.user.sub, dto.endpoint); }
  @Get() @ApiOperation({ summary: 'List notification delivery records' }) list(@Req() request: { user: { email: string; role: UserRole; salonId?: string } }) { return this.service.list(request.user.email, request.user.role === UserRole.ADMIN, request.user.salonId); }
  @Post(':id/retry') @ApiOperation({ summary: 'Retry a notification delivery' }) retry(@Param('id') id: string) { return this.service.deliver(id); }
}
