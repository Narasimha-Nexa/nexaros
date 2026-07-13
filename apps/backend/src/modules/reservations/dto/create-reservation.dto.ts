import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsDateString()
  date: string;

  @IsString()
  time: string;

  @IsNumber()
  guestCount: number;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
