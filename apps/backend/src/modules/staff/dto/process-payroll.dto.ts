import { IsOptional, IsString, IsDecimal, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProcessPayrollDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  allowances?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  deductions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  bonuses?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
