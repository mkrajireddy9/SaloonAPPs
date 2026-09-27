import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt() @Min(1) @Max(5) rating!: number;
  @ApiProperty({ example: 'Loved the consultation and the finish.' })
  @IsString() comment!: string;
  @ApiPropertyOptional({ example: 'appointment-id' })
  @IsOptional() @IsString() appointmentId?: string;
}

export class UpdateReviewStatusDto {
  @ApiProperty({ enum: ['Pending', 'Published', 'Rejected'] })
  @IsIn(['Pending', 'Published', 'Rejected']) status!: 'Pending' | 'Published' | 'Rejected';
}
