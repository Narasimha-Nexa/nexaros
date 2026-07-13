import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiProperty({ enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'], default: 'ACTIVE' })
  @IsEnum(['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'])
  @IsOptional()
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  razorpayId?: string;
}
