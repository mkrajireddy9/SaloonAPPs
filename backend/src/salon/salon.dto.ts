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
}
