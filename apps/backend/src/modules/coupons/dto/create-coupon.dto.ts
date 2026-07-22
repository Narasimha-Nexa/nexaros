import { IsString, IsOptional, IsNumber, IsIn, IsArray, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['FIXED_AMOUNT', 'PERCENTAGE'] })
  @IsIn(['FIXED_AMOUNT', 'PERCENTAGE'])
  type: 'FIXED_AMOUNT' | 'PERCENTAGE';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPlanPrice?: number;

  @ApiProperty()
  @IsString()
  expiry: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTotalUses?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxUsesPerUser?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicablePlans?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  festivalTag?: string;
}
