import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateCouponDto {
  @ApiProperty({ example: "WELCOME10" }) @IsString() @MinLength(3) code!: string;
  @ApiProperty({ enum: ["percent", "fixed"] }) @IsIn(["percent", "fixed"]) discountType!: "percent" | "fixed";
  @ApiProperty({ example: 10 }) @IsInt() @Min(1) discountValue!: number;
  @ApiPropertyOptional({ example: 100 }) @IsOptional() @IsInt() @Min(1) maxUses?: number;
}

export class UpdateCouponDto {
  @ApiProperty({ example: true }) @IsBoolean() active!: boolean;
}

export class UpdateReferralSettingsDto {
  @ApiProperty({ example: 100 }) @IsInt() @Min(0) rewardAmount!: number;
}

export class ClaimReferralDto {
  @ApiProperty({ example: "RAJ-7F3K2M" }) @IsString() @IsNotEmpty() code!: string;
  @ApiPropertyOptional({ example: "salon-uuid" }) @IsOptional() @IsString() salonId?: string;
}

export class ValidateCouponDto {
  @ApiProperty({ example: "WELCOME10" }) @IsString() @IsNotEmpty() code!: string;
  @ApiPropertyOptional({ example: "salon-uuid" }) @IsOptional() @IsString() salonId?: string;
  @ApiPropertyOptional({ example: 1000 }) @IsOptional() @IsInt() @Min(0) subtotal?: number;
}
