import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user.entity';
import { CreatePaymentDto, PaymentWebhookDto, RefundPaymentDto } from './payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments') @ApiTags('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}
  @Post('webhook') @ApiOperation({ summary: 'Process a payment provider webhook' }) webhook(@Body() dto: PaymentWebhookDto, @Headers('x-webhook-secret') secret?: string) { return this.service.webhook(dto, secret); }
  @Get() @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'List accessible payments and invoices' }) list(@Req() request: { user: { email: string; role: UserRole; salonId?: string } }) { return this.service.list(request.user); }
  @Post('intent') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Create an idempotent payment intent and invoice' }) create(@Body() dto: CreatePaymentDto, @Req() request: { user: { email: string; role: UserRole; salonId?: string } }) { return this.service.create(dto, request.user); }
  @Post(':id/refund') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Refund a paid payment' }) refund(@Param('id') id: string, @Body() dto: RefundPaymentDto, @Req() request: { user: { salonId?: string } }) { return this.service.refund(id, dto, request.user.salonId); }
}
