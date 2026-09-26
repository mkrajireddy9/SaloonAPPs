import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiPropertyOptional({ example: 'Ananya Rao' })
  @IsOptional() @IsString() guestName?: string;
  @ApiPropertyOptional({ example: 'ananya@example.com' })
  @IsOptional() @IsEmail() guestEmail?: string;
  @ApiProperty({ example: 'Signature cut' })
  @IsNotEmpty() @IsString() service!: string;
  @ApiProperty({ example: '2026-10-03' })
  @IsNotEmpty() @IsString() date!: string;
  @ApiProperty({ example: '10:30 AM' })
  @IsNotEmpty() @IsString() time!: string;
  @ApiPropertyOptional({ example: 'Meera Nair' })
  @IsOptional() @IsString() stylist?: string;
  @ApiPropertyOptional({ example: 'I would like a low-maintenance shape.' })
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: ['Requested', 'Confirmed'] })
  @IsIn(['Requested', 'Confirmed']) status!: 'Requested' | 'Confirmed';
}
