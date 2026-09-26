import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePassportDto {
  @ApiPropertyOptional({ example: 'Prefers low-maintenance shapes.' })
  @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: ['Low maintenance', 'Soft movement'] })
  @IsOptional() @IsArray() @IsString({ each: true }) preferences?: string[];
  @ApiPropertyOptional({ example: 'Meera Nair' })
  @IsOptional() @IsString() preferredStylist?: string;
}
