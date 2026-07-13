import { IsString, IsOptional, IsArray, IsNumber, Min, ValidateNested, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PublicOrderItemDto {
  @ApiProperty()
  @IsString()
  menuItemId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePublicOrderDto {
  @ApiProperty()
  @IsString()
  branchId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiProperty({ enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'QR_ORDER'] })
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number;

  @ApiProperty({ type: [PublicOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicOrderItemDto)
  items!: PublicOrderItemDto[];
}
