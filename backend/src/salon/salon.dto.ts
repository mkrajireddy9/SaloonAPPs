import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSalonDto {
  @ApiPropertyOptional({ example: 'Halo Studio' })
  @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ example: 'Indiranagar, Bengaluru' })
  @IsOptional() @IsString() location?: string;
  @ApiProperty({ example: ['Signature cut', 'Gloss refresh'] })
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) services!: string[];
  @ApiProperty({ example: ['Meera Nair', 'Arjun S.'] })
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) stylists!: string[];
  @ApiPropertyOptional({ example: { open: '09:00', close: '19:00' } })
  @IsOptional() @IsObject() openingHours?: { open: string; close: string };
  @ApiPropertyOptional({ example: ['Sunday'] })
  @IsOptional() @IsArray() @IsString({ each: true }) closedDays?: string[];
  @ApiPropertyOptional({ example: [{ name: 'Signature cut', durationMinutes: 60, price: 1840 }] })
  @IsOptional() @IsArray() serviceDetails?: PriceListItemDto[];
  @ApiPropertyOptional({ example: { 'Meera Nair': { workingDays: ['Monday', 'Tuesday'], leaveDates: [] } } })
  @IsOptional() @IsObject() stylistSchedules?: Record<string, { workingDays: string[]; leaveDates: string[] }>;
  @ApiPropertyOptional({ example: { 'Meera Nair': { bio: 'Specialises in textured cuts.', imageUrl: '/images/stylist-meera.jpg' } } })
  @IsOptional() @IsObject() stylistProfiles?: Record<string, { bio: string; imageUrl: string }>;
  @ApiPropertyOptional({ example: [{ id: 'main', name: 'Indiranagar', location: 'Bengaluru', openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'] }] })
  @IsOptional() @IsArray() branches?: { id: string; name: string; location: string; openingHours: { open: string; close: string }; closedDays: string[] }[];
}

export class PriceListItemDto {
  @ApiProperty({ example: 'Signature cut' }) @IsString() name!: string;
  @ApiProperty({ example: 60 }) durationMinutes!: number;
  @ApiProperty({ example: 1840 }) price!: number;
  @ApiPropertyOptional({ example: 15 }) @IsOptional() discountPercent?: number;
  @ApiPropertyOptional({ example: 1564 }) @IsOptional() discountPrice?: number;
  @ApiPropertyOptional({ example: 'New guest offer' }) @IsOptional() @IsString() offerText?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() active?: boolean;
  @ApiPropertyOptional({ example: '/images/signature-cut.jpg' }) @IsOptional() @IsString() imageUrl?: string;
}

export class UpdatePriceListDto {
  @ApiProperty({ type: [PriceListItemDto] }) @IsArray() items!: PriceListItemDto[];
}

export class UpdateSalonThemeDto {
  @ApiPropertyOptional({ example: 'halo' }) @IsOptional() @IsString() brandName?: string;
  @ApiPropertyOptional({ example: 'h' }) @IsOptional() @IsString() logoMark?: string;
  @ApiPropertyOptional({ example: 'https://example.com/logo.png' }) @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional({ example: '#b9533a' }) @IsOptional() @IsString() primary?: string;
  @ApiPropertyOptional({ example: '#20352d' }) @IsOptional() @IsString() sidebar?: string;
  @ApiPropertyOptional({ example: '#f7f5f0' }) @IsOptional() @IsString() surface?: string;
  @ApiPropertyOptional({ example: '#25372f' }) @IsOptional() @IsString() ink?: string;
}
