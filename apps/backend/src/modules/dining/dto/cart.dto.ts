import { IsString, IsOptional, IsInt, Min, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty() @IsString() menuItemId: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateCartItemDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
