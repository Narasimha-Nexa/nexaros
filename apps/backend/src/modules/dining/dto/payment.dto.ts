import { IsString, IsOptional, IsEnum, IsNumber, Min, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SplitType, PaymentMethod } from '@prisma/client';

export class SplitBillDto {
  @ApiProperty({ enum: SplitType }) @IsEnum(SplitType) splitType: SplitType;
}

export class ProcessPaymentDto {
  @ApiProperty() @IsString() guestSessionId: string;
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) method: PaymentMethod;
  @ApiProperty() @IsNumber() @Min(0.01) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}

export class FullPaymentDto {
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) method: PaymentMethod;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) tip?: number;
}

export class MultiPaymentItemDto {
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) method: PaymentMethod;
  @ApiProperty() @IsNumber() @Min(0.01) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}

export class MultiPaymentDto {
  @ApiProperty({ type: [MultiPaymentItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => MultiPaymentItemDto) payments: MultiPaymentItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) tip?: number;
}
