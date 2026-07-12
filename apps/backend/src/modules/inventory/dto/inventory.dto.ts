import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minimumStock: number;

  @ApiProperty()
  @IsNumber()
  costPrice: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  reorderQuantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  reorderQuantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;
}

export class AdjustStockDto {
  @ApiProperty({ enum: ['PURCHASE', 'SALE', 'WASTE', 'ADJUSTMENT', 'TRANSFER'] })
  @IsIn(['PURCHASE', 'SALE', 'WASTE', 'ADJUSTMENT', 'TRANSFER'])
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
  costPrice?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceId?: string;
}
