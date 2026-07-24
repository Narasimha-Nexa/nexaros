import { IsString, IsNumber, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKpiGoalDto {
  @ApiProperty({ description: 'Metric to track', example: 'revenue' })
  @IsString()
  metric!: string;

  @ApiProperty({ description: 'Target value', example: 100000 })
  @IsNumber()
  target!: number;

  @ApiPropertyOptional({ description: 'Measurement period', example: 'monthly' })
  @IsString()
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  period?: string;

  @ApiProperty({ description: 'Start date (ISO)' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'End date (ISO)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class UpdateKpiGoalDto {
  @ApiPropertyOptional({ description: 'New target value' })
  @IsNumber()
  @IsOptional()
  target?: number;

  @ApiPropertyOptional({ description: 'New measurement period' })
  @IsString()
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  period?: string;

  @ApiPropertyOptional({ description: 'New end date (ISO)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CreateKpiAlertDto {
  @ApiProperty({ description: 'Metric name' })
  @IsString()
  metric!: string;

  @ApiProperty({ description: 'Alert severity' })
  @IsString()
  @IsIn(['info', 'warning', 'critical'])
  severity!: string;

  @ApiProperty({ description: 'Alert title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Alert message' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Current value' })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ description: 'Threshold value' })
  @IsNumber()
  @IsOptional()
  threshold?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;
}
