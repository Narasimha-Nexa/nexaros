import { IsString, IsOptional, IsNumber, IsBoolean, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingCycle?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxBranches?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxStaff?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCustom?: boolean;

  @ApiProperty()
  @IsObject()
  entitlements: Record<string, boolean>;
}
