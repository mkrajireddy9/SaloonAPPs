import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from './user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'Ananya Rao' })
  @IsNotEmpty() @IsString() name!: string;
  @ApiProperty({ example: 'ananya@example.com' })
  @IsEmail() email!: string;
  @ApiProperty({ example: 'strong-password' })
  @MinLength(8) @IsString() password!: string;
  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional() @IsIn([UserRole.USER, UserRole.ADMIN]) role?: UserRole;
  @ApiPropertyOptional({ description: 'Required when registering an admin account.' })
  @IsOptional() @IsString() inviteCode?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ananya@example.com' })
  @IsEmail() email!: string;
  @ApiProperty({ example: 'strong-password' })
  @IsNotEmpty() @IsString() password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh-token-from-login' })
  @IsNotEmpty() @IsString() refreshToken!: string;
}
