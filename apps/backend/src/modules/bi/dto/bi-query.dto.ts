import { IsOptional, IsString, IsArray, IsEnum, IsDateString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BiQueryDto {
  @ApiPropertyOptional({ description: 'Tenant id (admin scope)' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Branch ids to scope (multiple)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @ApiPropertyOptional({ description: 'Start date ISO' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date ISO' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Compare with previous period' })
  @IsOptional()
  compare?: string;
}

export class GoalDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  metric: string;

  @IsString()
  target: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class ForecastQueryDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsInt()
  horizon?: number;
}
