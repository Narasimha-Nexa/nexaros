import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsNumber, Min, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PosOrderItemDto {
  @ApiProperty()
  @IsString()
  menuItemId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
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

export class CreatePosOrderDto {
  @ApiProperty({ enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'] })
  @IsEnum(['DINE_IN', 'TAKEAWAY', 'DELIVERY'])
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

  @ApiPropertyOptional({ enum: ['DINE_IN', 'QR', 'APP', 'SWIGGY', 'ZOMATO', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'ONDC'] })
  @IsOptional()
  @IsEnum(['DINE_IN', 'QR', 'APP', 'SWIGGY', 'ZOMATO', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'ONDC'])
  channel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  channelOrderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsNumber()
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

  @ApiProperty({ type: [PosOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];
}
