import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeliveryPartnerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  licensePlate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branchId?: string;
}
