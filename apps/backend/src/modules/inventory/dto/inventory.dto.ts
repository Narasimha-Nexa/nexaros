import { IsString, IsNumber, IsOptional, IsBoolean, IsInt, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minimumStock: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maximumStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierId?: string;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maximumStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitCost?: number;
}

export class AdjustStockDto {
  @ApiProperty({ enum: ['PURCHASE', 'USAGE', 'WASTE', 'ADJUSTMENT'] })
  @IsIn(['PURCHASE', 'USAGE', 'WASTE', 'ADJUSTMENT'])
  type: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceId?: string;
}
