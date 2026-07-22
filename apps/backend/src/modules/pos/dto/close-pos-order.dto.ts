import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClosePosOrderDto {
  @ApiPropertyOptional({ description: 'Payment method used' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Amount tendered (for cash payments)' })
  @IsNumber()
  @IsOptional()
  tenderedAmount?: number;

  @ApiPropertyOptional({ description: 'Tip amount' })
  @IsNumber()
  @IsOptional()
  tip?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
