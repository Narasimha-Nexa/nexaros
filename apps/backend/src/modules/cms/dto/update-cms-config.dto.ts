import {
  IsOptional, IsString, IsUrl, IsObject, IsArray, IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class UpdateCmsConfigDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  restaurantName?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  tagline?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsUrl()
  logo?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsUrl()
  favicon?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsUrl()
  mapUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  whatsappNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  timezone?: string;

  // Branding
  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  primaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  secondaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  accentColor?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  fontHeading?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  fontBody?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  borderRadius?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  containerWidth?: string;

  // JSON fields
  @ApiProperty({ required: false, type: Object })
  @IsOptional() @IsObject()
  features?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  @IsOptional() @IsObject()
  seo?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  @IsOptional() @IsObject()
  openingHours?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  @IsOptional() @IsObject()
  socialLinks?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  @IsOptional() @IsObject()
  analytics?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  @IsOptional() @IsObject()
  legalPages?: Record<string, any>;

  @ApiProperty({ required: false, type: [Object] })
  @IsOptional() @IsArray()
  homeSections?: any[];
}
