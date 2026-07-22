import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';

export class CreateDraftDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() restaurantName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() cuisineType?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() subdomain?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsEmail() ownerEmail: string;
  @IsOptional() @IsString() ownerPhone?: string;
  @IsOptional() @IsString() password?: string;
  @IsOptional() @IsBoolean() autoGenPassword?: boolean;
  @IsOptional() @IsString() planId?: string;
  @IsOptional() @IsString() billingCycle?: string;
  @IsOptional() @IsNumber() customAmount?: number;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() paymentProvider?: string;
  @IsOptional() @IsString() mode?: 'new_business' | 'add_branch';
  @IsOptional() @IsString() existingTenantId?: string;
  @IsOptional() @IsString() branchName?: string;
}

export class CheckOwnerDto {
  @IsEmail() email: string;
}

export class CheckOwnerResponse {
  exists: boolean;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    tenants: Array<{
      id: string;
      name: string;
      slug: string;
      subdomain: string | null;
      branches: Array<{ id: string; name: string; displayName: string | null }>;
    }>;
  };
}

export class ValidateCouponDto {
  @IsString() couponCode: string;
  @IsString() planId: string;
  @IsOptional() @IsString() billingCycle?: string;
}

export class CreatePaymentOrderDto {
  @IsString() requestId: string;
  @IsOptional() @IsString() paymentProvider?: string;
}

export class VerifyPaymentDto {
  @IsString() requestId: string;
  @IsString() paymentOrderId: string;
  @IsString() paymentId: string;
  @IsString() paymentSignature: string;
}

export class ExecuteProvisioningDto {
  @IsString() requestId: string;
  @IsOptional() @IsString() mode?: 'new_business' | 'add_branch';
  @IsOptional() @IsString() existingTenantId?: string;
  @IsOptional() @IsString() branchName?: string;
}

export class ProvisioningProgressResponse {
  id: string;
  status: string;
  progress: {
    step: number;
    message: string;
    completedSteps: string[];
    currentStep: string;
  };
}
