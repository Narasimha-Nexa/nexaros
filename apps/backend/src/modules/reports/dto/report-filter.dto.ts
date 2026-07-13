import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportFilterDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-12' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ enum: ['PDF', 'EXCEL', 'CSV'], default: 'PDF' })
  @IsEnum(['PDF', 'EXCEL', 'CSV'])
  @IsOptional()
  format?: 'PDF' | 'EXCEL' | 'CSV';
}
