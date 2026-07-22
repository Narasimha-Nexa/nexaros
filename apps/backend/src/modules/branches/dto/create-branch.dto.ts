import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'MG Road Branch' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'MG Road' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ example: 'BR-001' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'PRIMARY' })
  @IsString()
  @IsOptional()
  branchType?: string;

  @ApiPropertyOptional({ example: '456 MG Road, Bangalore 560001' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Bangalore' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 12.9716 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 77.5946 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'branch@restaurant.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '27AABCU9603R1ZM' })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsString()
  @IsOptional()
  fssai?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  diningCapacity?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsNumber()
  @IsOptional()
  deliveryRadius?: number;

  @ApiPropertyOptional({ example: { mon: { open: '09:00', close: '22:00' } } })
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, any>;

  @ApiPropertyOptional({ example: { printer1: 'Kitchen' } })
  @IsObject()
  @IsOptional()
  printerConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: { enabled: true } })
  @IsObject()
  @IsOptional()
  posConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: { prefix: 'QR' } })
  @IsObject()
  @IsOptional()
  qrConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: { primaryColor: '#000000' } })
  @IsObject()
  @IsOptional()
  theme?: Record<string, any>;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
