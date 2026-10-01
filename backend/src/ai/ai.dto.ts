import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBase64, IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class AnalyzeAiDto {
  @ApiPropertyOptional({ example: 'A low-maintenance shape with natural movement.' })
  @IsOptional() @IsString() goal?: string;
  @ApiPropertyOptional({ example: 'Wavy' })
  @IsOptional() @IsString() texture?: string;
  @ApiPropertyOptional({ example: 'Shoulder length' })
  @IsOptional() @IsString() length?: string;
  @ApiPropertyOptional({ description: 'Optional base64 image without the data URL prefix.' })
  @IsOptional() @IsBase64() imageBase64?: string;
}

export class QualityCheckDto {
  @ApiProperty({ example: 'front' })
  @IsNotEmpty() @IsString() view!: string;
  @ApiPropertyOptional({ description: 'Optional base64 image without the data URL prefix.' })
  @IsOptional() @IsBase64() imageBase64?: string;
}

export class TryOnDto {
  @ApiProperty({ example: 'Soft textured lob' })
  @IsNotEmpty() @IsString() styleName!: string;
  @ApiPropertyOptional({ description: 'Optional base64 source image without the data URL prefix.' })
  @IsOptional() @IsBase64() imageBase64?: string;
  @ApiPropertyOptional({ enum: ['gemini', 'pollinations'], default: 'gemini' })
  @IsOptional() @IsIn(['gemini', 'pollinations']) provider?: 'gemini' | 'pollinations';
}

export class HairProfileDto {
  @IsObject() profile!: Record<string, unknown>;
  @IsOptional() @IsObject() preferences?: Record<string, unknown>;
}

export class RecommendDto extends HairProfileDto {}

export class SeeOnMeDto {
  @IsBase64() originalImage!: string;
  @IsNotEmpty() @IsString() styleId!: string;
  @IsOptional() @IsObject() hairProfile?: Record<string, unknown>;
}

export class StylistInstructionsDto extends HairProfileDto {
  @IsNotEmpty() @IsString() selectedStyle!: string;
}
