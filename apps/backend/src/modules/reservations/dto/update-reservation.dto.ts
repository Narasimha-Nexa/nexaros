import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReservationStatusEnum {
  CONFIRMED = 'CONFIRMED',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export class UpdateReservationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  time?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  guestCount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: ReservationStatusEnum })
  @IsEnum(ReservationStatusEnum)
  @IsOptional()
  status?: ReservationStatusEnum;
}
