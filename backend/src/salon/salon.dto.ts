import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateSalonDto {
  @ApiPropertyOptional({ example: 'Halo Studio' })
  @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ example: 'Indiranagar, Bengaluru' })
  @IsOptional() @IsString() location?: string;
  @ApiProperty({ example: ['Signature cut', 'Gloss refresh'] })
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) services!: string[];
  @ApiProperty({ example: ['Meera Nair', 'Arjun S.'] })
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) stylists!: string[];
}
