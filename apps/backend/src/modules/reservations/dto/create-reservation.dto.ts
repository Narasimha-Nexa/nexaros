import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ description: 'Tenant ID (required for public API)' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty()
  @IsString()
  customerName: string;

  @ApiProperty()
  @IsString()
  customerPhone: string;

  @ApiProperty({ example: '2026-07-24' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '19:30' })
  @IsString()
  time: string;

  @ApiProperty({ minimum: 1, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  guestCount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
