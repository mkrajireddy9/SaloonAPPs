import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConsultationDto {
  @IsNotEmpty() @IsString() guestName!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() stylist?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsString() length?: string;
  @IsOptional() @IsString() texture?: string;
}

export class CaptureViewDto {
  @IsIn(['front', 'left', 'right']) view!: 'front' | 'left' | 'right';
}
