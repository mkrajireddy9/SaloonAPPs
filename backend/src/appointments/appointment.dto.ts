import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsOptional() @IsString() guestName?: string;
  @IsOptional() @IsEmail() guestEmail?: string;
  @IsNotEmpty() @IsString() service!: string;
  @IsNotEmpty() @IsString() date!: string;
  @IsNotEmpty() @IsString() time!: string;
  @IsOptional() @IsString() stylist?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsIn(['Requested', 'Confirmed']) status!: 'Requested' | 'Confirmed';
}
