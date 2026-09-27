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
  @IsOptional() @IsArray() serviceDetails?: { name: string; durationMinutes: number; price: number; imageUrl?: string }[];
  @ApiPropertyOptional({ example: { 'Meera Nair': { workingDays: ['Monday', 'Tuesday'], leaveDates: [] } } })
  @IsOptional() @IsObject() stylistSchedules?: Record<string, { workingDays: string[]; leaveDates: string[] }>;
  @ApiPropertyOptional({ example: { 'Meera Nair': { bio: 'Specialises in textured cuts.', imageUrl: '/images/stylist-meera.jpg' } } })
  @IsOptional() @IsObject() stylistProfiles?: Record<string, { bio: string; imageUrl: string }>;
  @ApiPropertyOptional({ example: [{ id: 'main', name: 'Indiranagar', location: 'Bengaluru', openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'] }] })
  @IsOptional() @IsArray() branches?: { id: string; name: string; location: string; openingHours: { open: string; close: string }; closedDays: string[] }[];
}
