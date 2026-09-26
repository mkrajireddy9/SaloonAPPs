import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsultationDto {
  @ApiProperty({ example: 'Ananya Rao' })
  @IsNotEmpty() @IsString() guestName!: string;
  @ApiPropertyOptional({ example: '+91 98450 12345' })
  @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: 'Meera Nair' })
  @IsOptional() @IsString() stylist?: string;
  @ApiPropertyOptional({ example: 'A cut that feels like me' })
  @IsOptional() @IsString() goal?: string;
  @ApiPropertyOptional({ example: 'Shoulder length' })
  @IsOptional() @IsString() length?: string;
  @ApiPropertyOptional({ example: 'Wavy' })
  @IsOptional() @IsString() texture?: string;
}

export class CaptureViewDto {
  @ApiProperty({ enum: ['front', 'left', 'right'] })
  @IsIn(['front', 'left', 'right']) view!: 'front' | 'left' | 'right';
}
