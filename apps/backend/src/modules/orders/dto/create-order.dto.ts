import { IsString, IsOptional, IsIn, IsArray, ValidateNested, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  menuItemId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'QR_ORDER'] })
  @IsOptional()
  @IsIn(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'QR_ORDER'])
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  guestCount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
