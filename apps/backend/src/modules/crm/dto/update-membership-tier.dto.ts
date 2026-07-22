import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMembershipTierDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPoints?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPoints?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
