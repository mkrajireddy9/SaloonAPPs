import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBase64, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
