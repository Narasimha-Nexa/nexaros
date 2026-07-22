import { IsString, IsOptional, IsBoolean, IsJSON, IsObject } from 'class-validator';

export class StartOnboardingDto {
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class UpdateRestaurantDto {
  @IsString()
  restaurantName: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  fssaiLicense?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  restaurantLogo?: string;
}

export class UpdateOwnerDto {
  @IsString()
  ownerName: string;

  @IsString()
  ownerEmail: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsString()
  password: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  taxMode?: string;

  @IsOptional()
  @IsObject()
  @IsOptional()
  billingPrefs?: Record<string, any>;

  @IsOptional()
  @IsObject()
  @IsOptional()
  kitchenSettings?: Record<string, any>;

  @IsOptional()
  @IsObject()
  @IsOptional()
  shiftTimings?: Record<string, any>;

  @IsOptional()
  @IsString()
  defaultPrinter?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  timeFormat?: string;

  @IsOptional()
  @IsObject()
  @IsOptional()
  websitePrefs?: Record<string, any>;
}

export class SelectPlanDto {
  @IsString()
  planId: string;

  @IsOptional()
  @IsString()
  billingCycle?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class CompleteOnboardingDto {
  @IsOptional()
  @IsString()
  razorpayOrderId?: string;

  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;

  @IsOptional()
  @IsString()
  razorpaySignature?: string;
}
