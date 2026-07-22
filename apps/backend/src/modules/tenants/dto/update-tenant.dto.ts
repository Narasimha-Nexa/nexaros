import {
  IsString, IsEmail, IsOptional, IsBoolean, Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'The Spice Kitchen' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@spicekitchen.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123 MG Road, Mumbai 400001' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Spice Kitchen Pvt Ltd' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ example: 'Spice Kitchen' })
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '27AABCU9603R1ZM' })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GST number format',
  })
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid PAN number format',
  })
  panNumber?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @ApiPropertyOptional({ example: 'South Indian' })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'spice-kitchen' })
  @IsString()
  @IsOptional()
  subdomain?: string;

  @ApiPropertyOptional({ example: 'spicekitchen.com' })
  @IsString()
  @IsOptional()
  customDomain?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
