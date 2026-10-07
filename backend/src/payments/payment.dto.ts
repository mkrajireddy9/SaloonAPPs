import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'appointment-uuid' }) @IsString() @IsNotEmpty() appointmentId!: string;
  @ApiProperty({ example: 'appointment-uuid-checkout-1' }) @IsString() @IsNotEmpty() idempotencyKey!: string;
  @ApiPropertyOptional({ example: 100 }) @IsOptional() @IsInt() @Min(0) discount?: number;
}

export class PaymentWebhookDto {
  @ApiProperty({ example: 'pi_local_123' }) @IsString() @IsNotEmpty() providerPaymentId!: string;
  @ApiProperty({ example: 'paid' }) @Matches(/^(paid|failed|refunded)$/) status!: 'paid' | 'failed' | 'refunded';
}

export class RefundPaymentDto {
  @ApiPropertyOptional({ example: 'Customer cancelled' }) @IsOptional() @IsString() reason?: string;
}

export class VerifyRazorpayPaymentDto {
  @ApiProperty() @IsString() @IsNotEmpty() razorpayOrderId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() razorpayPaymentId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() razorpaySignature!: string;
}
