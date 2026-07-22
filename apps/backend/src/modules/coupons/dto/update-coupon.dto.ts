import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  expiry?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTotalUses?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
