import { IsString, IsOptional, IsInt, Min, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddSharedItemDto {
  @ApiProperty() @IsString() menuItemId: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty() @IsArray() @ValidateNested({ each: true }) @Type(() => SharedItemAllocationDto) allocations: SharedItemAllocationDto[];
}

export class SharedItemAllocationDto {
  @ApiProperty() @IsString() guestSessionId: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() percentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() amount?: number;
}
