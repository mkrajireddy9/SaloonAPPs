import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ example: 'Ananya Rao' }) @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiPropertyOptional({ example: 'ananya@example.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ example: '+91 98450 12345' }) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional({ example: 'Indiranagar, Bengaluru' }) @IsOptional() @IsString() @MaxLength(160) location?: string;
  @ApiPropertyOptional({ example: 'Wavy' }) @IsOptional() @IsString() @MaxLength(40) texture?: string;
  @ApiPropertyOptional({ example: 'Shoulder length' }) @IsOptional() @IsString() @MaxLength(60) length?: string;
  @ApiPropertyOptional({ example: 'Meera Nair' }) @IsOptional() @IsString() @MaxLength(100) preferredStylist?: string;
}

export class CustomerHistoryQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' }) @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional({ example: '2026-12-31' }) @IsOptional() @IsDateString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() service?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stylist?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional({ enum: ['Requested', 'Confirmed', 'Cancelled'] }) @IsOptional() @IsIn(['Requested', 'Confirmed', 'Cancelled']) status?: 'Requested' | 'Confirmed' | 'Cancelled';
  @ApiPropertyOptional({ default: 1 }) @IsOptional() page?: number;
  @ApiPropertyOptional({ default: 10 }) @IsOptional() pageSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
