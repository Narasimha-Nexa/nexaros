import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryPartnerDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  phone: string;

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
