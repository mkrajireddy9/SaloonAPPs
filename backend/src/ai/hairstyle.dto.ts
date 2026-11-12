import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class AnalyzeHairstyleDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  sessionId!: string;

  @ApiPropertyOptional({ example: "low maintenance" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  goal?: string;

  @ApiPropertyOptional({ example: "medium" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  preferredLength?: string;

  @ApiPropertyOptional({ enum: ["low", "medium", "high"] })
  @IsOptional()
  @IsIn(["low", "medium", "high"])
  maintenance?: string;

  @ApiPropertyOptional({ example: "wedding" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  occasion?: string;

  @ApiPropertyOptional({
    enum: ["feminine", "masculine", "androgynous", "no-preference"],
  })
  @IsOptional()
  @IsIn(["feminine", "masculine", "androgynous", "no-preference"])
  stylePreference?: string;
}

export class GenerateHairstyleDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  recommendationId!: string;

  @ApiProperty({
    description:
      "Client-generated key to prevent duplicate generation requests",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(180)
  idempotencyKey!: string;
}

export class ConsentDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  consentGiven!: boolean;
}
