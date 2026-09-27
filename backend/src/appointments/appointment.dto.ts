import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiPropertyOptional({ example: 'Ananya Rao' })
  @IsOptional() @IsString() @MinLength(2) guestName?: string;
  @ApiPropertyOptional({ example: 'ananya@example.com' })
  @IsOptional() @IsEmail() guestEmail?: string;
  @ApiProperty({ example: 'Signature cut' })
  @IsNotEmpty() @IsString() service!: string;
  @ApiPropertyOptional({ example: 'main' })
  @IsOptional() @IsString() @MinLength(1) branchId?: string;
  @ApiProperty({ example: '2026-10-03' })
  @IsNotEmpty() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  @ApiProperty({ example: '10:30 AM' })
  @IsNotEmpty() @Matches(/^\d{1,2}:\d{2}(\s?[AP]M)?$/i) time!: string;
  @ApiPropertyOptional({ example: 'Meera Nair' })
  @IsOptional() @IsString() stylist?: string;
  @ApiPropertyOptional({ example: 'I would like a low-maintenance shape.' })
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: ['Requested', 'Confirmed', 'Cancelled'] })
  @IsIn(['Requested', 'Confirmed', 'Cancelled']) status!: 'Requested' | 'Confirmed' | 'Cancelled';
}

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-10-10' })
  @IsNotEmpty() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  @ApiProperty({ example: '11:15 AM' })
  @IsNotEmpty() @Matches(/^\d{1,2}:\d{2}(\s?[AP]M)?$/i) time!: string;
}
