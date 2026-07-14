import { PartialType } from '@nestjs/swagger';

export class UpdateCmsConfigDto {
  restaurantName?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  phone?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
  whatsappNumber?: string;
  currency?: string;
  timezone?: string;

  // Branding
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontHeading?: string;
  fontBody?: string;
  borderRadius?: string;
  containerWidth?: string;

  // JSON fields
  features?: Record<string, any>;
  seo?: Record<string, any>;
  openingHours?: Record<string, any>;
  socialLinks?: Record<string, any>;
  analytics?: Record<string, any>;
  legalPages?: Record<string, any>;
  homeSections?: any[];
}
