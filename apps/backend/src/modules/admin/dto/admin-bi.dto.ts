import { IsString, IsOptional, IsDateString, IsArray, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminBiQueryDto {
  @ApiProperty()
  @IsString()
  tenantId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  compare?: string;
}

export class AdminForecastQueryDto {
  @ApiProperty()
  @IsString()
  tenantId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  horizon?: number;
}
