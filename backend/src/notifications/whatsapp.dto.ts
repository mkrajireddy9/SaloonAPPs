import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class SendWhatsAppDto {
  @ApiProperty({ example: "+919876543210" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9 ()-]{8,20}$/)
  recipientPhone!: string;

  @ApiProperty({ example: "New services are now available at Halo Salon." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  message!: string;

  @ApiPropertyOptional({ example: "Product announcement" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;
}
