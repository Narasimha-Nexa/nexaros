import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FinanceFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({ required: false, enum: ['INCOME', 'EXPENSE'] })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
