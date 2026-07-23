import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OwnerProfileService } from '../owner-profile/owner-profile.service';
import { PaymentGateway } from '../../common/providers/payment-gateway';
import { GatewayService } from '../websockets/gateway.service';
import { CreateDraftDto, ValidateCouponDto } from './dto/provisioning.dto';
import * as bcrypt from 'bcryptjs';

const GST_RATE = 18;

const PROVISIONING_STEPS = [
  { key: 'validating', label: 'Validating inputs', order: 1 },
  { key: 'tenant', label: 'Creating restaurant', order: 2 },
  { key: 'branch', label: 'Setting up branch', order: 3 },
  { key: 'permissions', label: 'Configuring permissions', order: 4 },
  { key: 'roles', label: 'Creating roles', order: 5 },
  { key: 'owner', label: 'Creating owner account', order: 6 },
  { key: 'staff', label: 'Linking staff record', order: 7 },
  { key: 'subscription', label: 'Activating subscription', order: 8 },
  { key: 'website', label: 'Generating website config', order: 9 },
  { key: 'categories', label: 'Creating menu categories', order: 10 },
  { key: 'tables', label: 'Setting up tables', order: 11 },
  { key: 'shifts', label: 'Configuring shifts', order: 12 },
  { key: 'membership', label: 'Creating membership tiers', order: 13 },
  { key: 'tax', label: 'Setting up tax rates', order: 14 },
  { key: 'featureflags', label: 'Enabling feature flags', order: 15 },
  { key: 'settings', label: 'Applying settings', order: 16 },
];

const BRANCH_ONLY_STEPS = [
  { key: 'validating', label: 'Validating inputs', order: 1 },
  { key: 'branch', label: 'Setting up branch', order: 2 },
  { key: 'subscription', label: 'Activating subscription', order: 3 },
  { key: 'tables', label: 'Setting up tables', order: 4 },
  { key: 'shifts', label: 'Configuring shifts', order: 5 },
];

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    private prisma: PrismaService,
    private ownerProfileService: OwnerProfileService,
    private paymentGateway: PaymentGateway,
    private gateway: GatewayService,
  ) {}

  // ── Check if Owner Exists ──
  async checkOwner(email: string) {
    const owner = await this.ownerProfileService.findByEmail(email);
    if (!owner) {
      return { exists: false };
    }

    return {
      exists: true,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        tenants: owner.tenants.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          subdomain: t.subdomain,
          branches: t.branches.map((b) => ({
            id: b.id,
            name: b.name,
            displayName: b.displayName,
          })),
        })),
      },
    };
  }

  // ── Create/Update Draft ──
  async createDraft(dto: CreateDraftDto, ip?: string, ua?: string) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (dto.id) {
      const existing = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: dto.id } });
      if (!existing || existing.status !== 'DRAFT') {
        throw new BadRequestException('Draft not found or already processed');
      }
      return this.prisma.restaurantProvisionRequest.update({
        where: { id: dto.id },
        data: { ...this.mapDraftData(dto), expiresAt, ipAddress: ip, userAgent: ua },
      });
    }

    return this.prisma.restaurantProvisionRequest.create({
      data: {
        ...this.mapDraftData(dto),
        status: 'DRAFT',
        expiresAt,
        ipAddress: ip,
        userAgent: ua,
        progress: { step: 0, message: 'Draft created', completedSteps: [], currentStep: '' },
      } as any,
    });
  }

  private mapDraftData(dto: CreateDraftDto) {
    const mode = dto.mode || 'new_business';
    const restaurantName =
      dto.restaurantName ||
      (mode === 'add_branch' ? dto.branchName || 'New Branch' : undefined);
    const ownerName =
      dto.ownerName ||
      (mode === 'add_branch' ? dto.ownerEmail.split('@')[0] : undefined);
    return {
      restaurantName,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      country: dto.country || 'India',
      cuisineType: dto.cuisineType,
      gstNumber: dto.gstNumber,
      timezone: dto.timezone || 'Asia/Kolkata',
      currency: dto.currency || 'INR',
      subdomain: dto.subdomain,
      logo: dto.logo,
      ownerName,
      ownerEmail: dto.ownerEmail,
      ownerPhone: dto.ownerPhone,
      password: dto.password,
      autoGenPassword: dto.autoGenPassword ?? true,
      planId: dto.planId,
      billingCycle: dto.billingCycle || 'MONTHLY',
      customAmount: dto.customAmount != null ? Number(dto.customAmount) : null,
      couponCode: dto.couponCode,
      paymentProvider: dto.paymentProvider || 'razorpay',
      mode: dto.mode || 'new_business',
      existingTenantId: dto.existingTenantId || null,
      branchName: dto.branchName || null,
    };
  }

  // ── Update Draft (for retry after failed provisioning) ──
  async updateDraft(requestId: string, updates: Partial<CreateDraftDto>) {
    const existing = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    if (!existing) throw new NotFoundException('Provision request not found');
    if (existing.status !== 'FAILED' && existing.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot update: request is in ${existing.status} state`);
    }

    const data: any = {};
    if (updates.ownerEmail !== undefined) data.ownerEmail = updates.ownerEmail;
    if (updates.ownerName !== undefined) data.ownerName = updates.ownerName;
    if (updates.ownerPhone !== undefined) data.ownerPhone = updates.ownerPhone;
    if (updates.restaurantName !== undefined) {
      data.restaurantName = updates.restaurantName;
    }
    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.email !== undefined) data.email = updates.email;
    if (updates.address !== undefined) data.address = updates.address;
    if (updates.city !== undefined) data.city = updates.city;
    if (updates.state !== undefined) data.state = updates.state;
    if (updates.country !== undefined) data.country = updates.country;

    return this.prisma.restaurantProvisionRequest.update({
      where: { id: requestId },
      data: { ...data, status: 'DRAFT', error: null },
    });
  }

  // ── Validate before payment ──
  async validatePreProvision(requestId: string) {
    const request = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Provision request not found');

    const issues: { field: string; message: string }[] = [];
    const mode = request.mode || 'new_business';

    // For new business: check slug and subdomain uniqueness
    const slug = (request.restaurantName || '')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let subdomain = request.subdomain?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || slug;
    subdomain = subdomain.replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    if (!subdomain) subdomain = slug;

    if (mode === 'new_business') {
      if (slug) {
        const existingTenant = await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
        if (existingTenant) issues.push({ field: 'restaurantName', message: 'A restaurant with a similar name already exists' });
      }
      if (subdomain) {
        const existingSubdomain = await this.prisma.tenant.findFirst({ where: { subdomain, deletedAt: null } });
        if (existingSubdomain) issues.push({ field: 'subdomain', message: `Subdomain "${subdomain}" is already taken` });
      }
    }

    // For add_branch: validate the existing tenant
    if (mode === 'add_branch') {
      if (!request.existingTenantId) {
        issues.push({ field: 'existingTenantId', message: 'Existing tenant ID is required for add_branch mode' });
      } else {
        const tenant = await this.prisma.tenant.findFirst({
          where: { id: request.existingTenantId, deletedAt: null },
        });
        if (!tenant) {
          issues.push({ field: 'existingTenantId', message: 'Existing business not found' });
        }
      }

      // Check branch name uniqueness
      if (request.branchName && request.existingTenantId) {
        const existingBranch = await this.prisma.branch.findFirst({
          where: { tenantId: request.existingTenantId, name: request.branchName, deletedAt: null },
        });
        if (existingBranch) {
          issues.push({ field: 'branchName', message: `Branch "${request.branchName}" already exists for this business` });
        }
      }

      // Check plan limits
      if (request.existingTenantId && request.planId) {
        const plan = await this.prisma.platformPlan.findUnique({ where: { id: request.planId } });
        if (plan && plan.maxBranches) {
          const branchCount = await this.prisma.branch.count({
            where: { tenantId: request.existingTenantId, deletedAt: null },
          });
          if (branchCount >= plan.maxBranches) {
            issues.push({
              field: 'planLimit',
              message: `Branch limit reached (${plan.maxBranches}). Upgrade your plan to add more branches.`,
            });
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      slug,
      subdomain: `${subdomain}.nexaros.in`,
      mode,
    };
  }

  // ── Get Plans ──
  async getPlans() {
    return this.prisma.platformPlan.findMany({
      where: { isActive: true, deletedAt: null },
      include: { entitlements: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ── Validate Coupon ──
  async validateCoupon(dto: ValidateCouponDto) {
    if (!dto.couponCode?.trim()) throw new BadRequestException('Coupon code is required');

    const coupon = await this.prisma.coupon.findFirst({
      where: { code: dto.couponCode.trim().toUpperCase(), isActive: true },
    });

    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (coupon.expiry && new Date() > coupon.expiry) throw new BadRequestException('Coupon has expired');
    if (coupon.maxTotalUses) {
      const usageCount = await this.prisma.couponUsage.count({ where: { couponId: coupon.id } });
      if (usageCount >= coupon.maxTotalUses) throw new BadRequestException('Coupon usage limit reached');
    }

    const plan = await this.prisma.platformPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const basePrice = Number(plan.price);
    let discount = 0;

    if (coupon.type === 'PERCENTAGE') {
      discount = Math.min(
        basePrice * Number(coupon.value) / 100,
        coupon.maxDiscount ? Number(coupon.maxDiscount) : basePrice,
      );
    } else {
      discount = Math.min(Number(coupon.value), basePrice);
    }

    const discountType = coupon.type;
    const subtotal = basePrice;
    const taxAmount = (subtotal - discount) * GST_RATE / 100;
    const totalAmount = Math.max(subtotal - discount + taxAmount, 0);

    return {
      valid: true,
      code: coupon.code,
      name: coupon.description || coupon.code,
      type: discountType,
      value: Number(coupon.value),
      discountAmount: discount,
      subtotal,
      taxRate: GST_RATE,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
    };
  }

  // ── Calculate Price ──
  async calculatePrice(planId: string, couponCode?: string, billingCycle?: string, customAmount?: number) {
    const plan = await this.prisma.platformPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const isCustomPlan = plan.slug?.toLowerCase().includes('enterprise') || plan.isCustom;
    let basePrice = Number(plan.price);
    if (isCustomPlan && customAmount != null && Number(customAmount) > 0) {
      basePrice = Number(customAmount);
    } else if (billingCycle === 'YEARLY' && Number(plan.price) > 0) {
      basePrice = Math.round(Number(plan.price) * 10 * 100) / 100;
    }

    let discountAmount = 0;
    let discountType = null;
    let couponName = null;

    if (couponCode?.trim()) {
      const coupon = await this.prisma.coupon.findFirst({
        where: { code: couponCode.trim().toUpperCase(), isActive: true },
      });

      if (coupon && (!coupon.expiry || new Date() <= coupon.expiry)) {
        if (coupon.type === 'PERCENTAGE') {
          discountAmount = Math.min(
            basePrice * Number(coupon.value) / 100,
            coupon.maxDiscount ? Number(coupon.maxDiscount) : basePrice,
          );
        } else {
          discountAmount = Math.min(Number(coupon.value), basePrice);
        }
        discountType = coupon.type;
        couponName = coupon.description || coupon.code;
      }
    }

    const subtotal = basePrice;
    const taxableAmount = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxableAmount * GST_RATE / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
      plan: { id: plan.id, name: plan.name, slug: plan.slug, billingCycle: billingCycle || 'MONTHLY' },
      subtotal,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountType,
      couponCode: couponName,
      taxRate: GST_RATE,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      yearlyPrice: billingCycle === 'YEARLY' ? basePrice : null,
      monthlyEquivalent: billingCycle === 'YEARLY' ? Math.round((basePrice / 10) * 100) / 100 : null,
      savingsPercent: billingCycle === 'YEARLY' ? 20 : 0,
    };
  }

  // ── Create Payment Order ──
  async createPaymentOrder(requestId: string, provider?: string) {
    const request = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Provision request not found');
    if (request.status !== 'DRAFT') throw new BadRequestException(`Request is in ${request.status} state`);

    const plan = await this.prisma.platformPlan.findUnique({ where: { id: request.planId! } });
    if (!plan) throw new NotFoundException('Plan not found');

    const isCustomPlan = plan.slug?.toLowerCase().includes('enterprise') || plan.isCustom;
    const customAmount = request.customAmount != null ? Number(request.customAmount) : undefined;
    const pricing = await this.calculatePrice(request.planId!, request.couponCode || undefined, request.billingCycle || undefined, customAmount);

    if (Number(plan.price) === 0 && !(isCustomPlan && customAmount && customAmount > 0)) {
      throw new BadRequestException('Free plan does not require payment. Use execute directly.');
    }

    const result = await this.paymentGateway.createOrder({
      amount: pricing.totalAmount,
      currency: 'INR',
      planSlug: plan.slug,
      customerEmail: request.ownerEmail,
      customerPhone: request.ownerPhone || undefined,
    });

    await this.prisma.restaurantProvisionRequest.update({
      where: { id: requestId },
      data: {
        status: 'PAYMENT_PENDING',
        paymentOrderId: result.razorpayOrderId || null,
        paymentProvider: provider || 'razorpay',
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        discountType: pricing.discountType,
        taxRate: pricing.taxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        currencyCode: 'INR',
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        provisionRequestId: requestId,
        event: 'PAYMENT_INITIATED',
        provider: provider || 'razorpay',
        providerOrderId: result.razorpayOrderId,
        amount: pricing.totalAmount,
        currency: 'INR',
        status: 'INITIATED',
      },
    });

    return {
      orderId: result.razorpayOrderId,
      amount: pricing.totalAmount,
      currency: 'INR',
      requestId,
      pricing,
    };
  }

  // ── Verify Payment ──
  async verifyPayment(requestId: string, paymentOrderId: string, paymentId: string, paymentSignature: string) {
    const request = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Provision request not found');
    if (request.status !== 'PAYMENT_PENDING') throw new BadRequestException(`Request is in ${request.status} state`);

    const verification = await this.paymentGateway.verifyPayment(paymentOrderId, paymentId, paymentSignature);

    if (!verification.success) {
      await this.prisma.restaurantProvisionRequest.update({
        where: { id: requestId },
        data: { paymentStatus: 'FAILED', status: 'DRAFT', error: verification.error },
      });

      await this.prisma.paymentEvent.create({
        data: {
          provisionRequestId: requestId,
          event: 'PAYMENT_FAILED',
          provider: request.paymentProvider || 'razorpay',
          providerOrderId: paymentOrderId,
          providerPaymentId: paymentId,
          amount: request.totalAmount,
          currency: request.currencyCode || 'INR',
          status: 'FAILED',
          metadata: { error: verification.error },
        },
      });

      throw new BadRequestException(`Payment verification failed: ${verification.error}`);
    }

    await this.prisma.restaurantProvisionRequest.update({
      where: { id: requestId },
      data: {
        status: 'PAYMENT_SUCCESS',
        paymentId,
        paymentSignature,
        paymentStatus: 'CAPTURED',
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        provisionRequestId: requestId,
        event: 'PAYMENT_CAPTURED',
        provider: request.paymentProvider || 'razorpay',
        providerOrderId: paymentOrderId,
        providerPaymentId: paymentId,
        amount: request.totalAmount,
        currency: request.currencyCode || 'INR',
        status: 'CAPTURED',
      },
    });

    return { success: true, requestId, status: 'PAYMENT_SUCCESS' };
  }

  // ── Execute Provisioning ──
  async executeProvisioning(requestId: string, adminUserId: string, ip?: string) {
    const request = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Provision request not found');

    const mode = request.mode || 'new_business';
    const planForCheck = request.planId
      ? await this.prisma.platformPlan.findUnique({ where: { id: request.planId } })
      : await this.prisma.platformPlan.findFirst({ where: { slug: 'starter-free', isActive: true } });
    const isFree = !planForCheck || Number(planForCheck.price) === 0;
    const isPaid = request.status === 'PAYMENT_SUCCESS';
    const isRetry = (request.status === 'FAILED' || request.status === 'DRAFT') && request.paymentStatus === 'CAPTURED';

    if (!isFree && !isPaid && !isRetry) {
      throw new BadRequestException(`Cannot execute: request is in ${request.status} state. Payment must be verified first.`);
    }

    await this.prisma.restaurantProvisionRequest.update({
      where: { id: requestId },
      data: { status: 'PROVISIONING', error: null },
    });

    const freshRequest = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    const req = freshRequest || request;

    try {
      // ── Find or Create OwnerProfile ──
      const { ownerProfile, isNewOwner, plainPassword } = await this.resolveOwnerProfile(req);
      const steps = mode === 'add_branch' ? BRANCH_ONLY_STEPS : PROVISIONING_STEPS;

      let result;

      if (mode === 'add_branch') {
        result = await this.provisionBranch(req, ownerProfile, planForCheck, adminUserId, ip, steps);
      } else {
        result = await this.provisionNewBusiness(req, ownerProfile, isNewOwner, plainPassword, planForCheck, adminUserId, ip, steps);
      }

      await this.prisma.restaurantProvisionRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          tenantId: result.tenant.id,
          branchId: result.branch.id,
          ownerId: result.owner?.id || null,
          staffId: result.staff?.id || null,
          subscriptionId: result.subscription?.id || null,
          completedAt: new Date(),
          progress: { step: steps.length, message: 'Done', completedSteps: steps.map(s => s.key), currentStep: 'completed' },
        },
      });

      this.emitProgress(requestId, 'completed', 'Provisioning completed successfully!');

      // ── Emit real-time events ──
      this.emitRealtimeEvents(req, result);

      return {
        success: true,
        requestId,
        mode,
        restaurant: {
          id: result.tenant.id, name: result.tenant.name,
          slug: result.tenant.slug, subdomain: result.tenant.subdomain,
          city: result.tenant.city, country: result.tenant.country,
          timezone: result.tenant.timezone, currency: result.tenant.currency,
        },
        branch: { id: result.branch.id, name: result.branch.name },
        owner: result.owner ? {
          id: result.owner.id, name: result.owner.firstName || ownerProfile.name,
          email: req.ownerEmail, password: plainPassword || req.password || 'Auto-generated',
        } : null,
        subscription: result.subscription ? {
          id: result.subscription.id, plan: planForCheck?.name || 'N/A',
          status: result.subscription.status,
          trialEndsAt: result.subscription.trialEndsAt,
        } : null,
        provisioning: {
          permissions: 140,
          ...(mode === 'new_business' ? {
            featureFlags: 0, settings: 24, taxSettings: 4,
            membershipTiers: 3, shifts: 3, categories: 8, tables: 10,
          } : { tables: 10 }),
        },
      };

    } catch (error: any) {
      await this.prisma.restaurantProvisionRequest.update({
        where: { id: requestId },
        data: { status: 'FAILED', error: error.message, retryCount: { increment: 1 } },
      });
      this.emitProgress(requestId, 'failed', `Provisioning failed: ${error.message}`);
      throw error;
    }
  }

  // ── Resolve Owner Profile (find existing or create new) ──
  private async resolveOwnerProfile(req: any) {
    const email = req.ownerEmail.toLowerCase().trim();
    let ownerProfile = await this.prisma.ownerProfile.findFirst({
      where: { email, deletedAt: null },
    });

    let isNewOwner = false;
    let plainPassword: string | undefined;

    if (!ownerProfile) {
      isNewOwner = true;
      plainPassword = req.password || this.generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword as string, 10);

      ownerProfile = await this.prisma.ownerProfile.create({
        data: {
          email,
          phone: req.ownerPhone?.trim() || null,
          password: hashedPassword,
          name: req.ownerName.trim(),
          isActive: true,
        },
      });
    }

    return { ownerProfile, isNewOwner, plainPassword };
  }

  // ── Provision New Business (Tenant + Branch + Owner User) ──
  private async provisionNewBusiness(
    req: any, ownerProfile: any, isNewOwner: boolean, plainPassword: string | undefined,
    plan: any, adminUserId: string, ip: string | undefined, steps: typeof PROVISIONING_STEPS,
  ) {
    const slug = (req.restaurantName || '')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let subdomain = req.subdomain?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || slug;
    subdomain = subdomain.replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    if (!subdomain) subdomain = slug;

    // Validate uniqueness
    const existingTenant = await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
    if (existingTenant) throw new BadRequestException('A restaurant with a similar name already exists');

    const existingSubdomain = await this.prisma.tenant.findFirst({ where: { subdomain, deletedAt: null } });
    if (existingSubdomain) throw new BadRequestException(`Subdomain "${subdomain}" is already taken`);

    const plainOwnerPassword = plainPassword || req.password || this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainOwnerPassword, 10);

    const entitlements = plan
      ? Object.fromEntries(
          (await this.prisma.planEntitlement.findMany({ where: { planId: plan.id } })).map(
            (e: any) => [e.moduleKey, e.enabled],
          ),
        )
      : {};

    const allFeatureFlags = await this.prisma.featureFlag.findMany();
    const trialDays = plan?.trialDays || 14;
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      this.emitProgress(req.id, 'tenant', 'Creating business...');

      const tenant = await tx.tenant.create({
        data: {
          ownerProfileId: ownerProfile.id,
          name: req.restaurantName.trim(),
          slug, subdomain,
          phone: req.phone || req.ownerPhone || null,
          email: req.ownerEmail.trim(),
          address: req.address?.trim() || null,
          gstNumber: req.gstNumber?.trim() || null,
          city: req.city?.trim() || null,
          state: req.state?.trim() || null,
          country: req.country || 'India',
          timezone: req.timezone || 'Asia/Kolkata',
          currency: req.currency || 'INR',
          businessType: req.cuisineType?.trim() || null,
          logo: req.logo || null,
          isActive: true,
          status: 'ACTIVE',
          onboardingStatus: 'IN_PROGRESS',
          createdBy: adminUserId,
        },
      });

      this.emitProgress(req.id, 'branch', 'Setting up branch...');
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: req.branchName || 'Main Branch',
          displayName: req.restaurantName?.trim() || 'Main Branch',
          address: req.address?.trim() || null,
          city: req.city?.trim() || null,
          state: req.state?.trim() || null,
          country: req.country || 'India',
          phone: req.phone || req.ownerPhone || null,
          branchType: 'PRIMARY',
          isPrimary: true,
          isActive: true,
          status: 'ACTIVE',
        },
      });

      this.emitProgress(req.id, 'permissions', 'Configuring permissions...');
      const permissions = await Promise.all(
        this.getDefaultPermissions().map((p: any) =>
          tx.permission.upsert({
            where: { module_action: { module: p.module, action: p.action } },
            update: {},
            create: p,
          }),
        ),
      );

      this.emitProgress(req.id, 'roles', 'Creating roles...');
      const ownerRole = await tx.role.create({
        data: {
          tenantId: tenant.id, name: 'Owner', description: 'Full access to all features',
          isSystem: true,
          permissions: { create: permissions.map((p: any) => ({ permissionId: p.id })) },
        },
      });

      const roleDefs = this.getDefaultRoleDefinitions(permissions);
      for (const roleDef of roleDefs) {
        if (roleDef.name === 'Owner') continue;
        const dedupedIds = [...new Set(roleDef.permissionIds)].filter(Boolean) as string[];
        await tx.role.create({
          data: {
            tenantId: tenant.id, name: roleDef.name, description: roleDef.description,
            isSystem: true,
            permissions: dedupedIds.length > 0
              ? { create: dedupedIds.map((pid: string) => ({ permissionId: pid })) }
              : undefined,
          },
        });
      }

      this.emitProgress(req.id, 'owner', 'Creating owner account...');
      const ownerUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: req.ownerEmail.trim(),
          phone: req.ownerPhone?.trim() || null,
          password: hashedPassword,
          firstName: req.ownerName.trim(),
          lastName: '',
          role: 'OWNER',
          isActive: true,
        },
      });

      this.emitProgress(req.id, 'staff', 'Linking staff record...');
      const staff = await tx.staff.create({
        data: {
          tenantId: tenant.id, branchId: branch.id, userId: ownerUser.id,
          roleId: ownerRole.id, name: req.ownerName.trim(),
          phone: req.ownerPhone?.trim() || null, status: 'ACTIVE', isActive: true,
        },
      });

      this.emitProgress(req.id, 'subscription', 'Activating subscription...');
      let subscription = null;
      if (plan) {
        const isFreePlan = Number(plan.price) === 0;
        const isCustomPaid = (plan.isCustom || plan.slug?.toLowerCase().includes('enterprise')) && Number(req.customAmount) > 0;
        const treatAsPaid = !isFreePlan || isCustomPaid;
        subscription = await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            planId: plan.id,
            status: treatAsPaid ? 'ACTIVE' : 'TRIAL',
            entitlements,
            trialStartedAt: now, trialEndsAt,
            currentPeriodStart: now,
            currentPeriodEnd: treatAsPaid ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : trialEndsAt,
            nextBillingDate: treatAsPaid ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : trialEndsAt,
            gracePeriodDays: 7,
          },
        });
      }

      this.emitProgress(req.id, 'website', 'Generating website...');
      await tx.tenantWebsiteConfig.create({
        data: {
          tenantId: tenant.id,
          restaurantName: req.restaurantName.trim(),
          phone: req.phone || req.ownerPhone || null,
          email: req.ownerEmail.trim(),
          address: req.address?.trim() || null,
          primaryColor: '#E51A24', secondaryColor: '#111111', accentColor: '#F1B31C',
          currency: req.currency || 'INR', timezone: req.timezone || 'Asia/Kolkata',
          features: { qrOrdering: true, onlineOrdering: true, reservations: true, gallery: true, reviews: true },
          seo: {
            title: `${req.restaurantName.trim()} | Best Restaurant in ${req.city || 'Town'}`,
            description: `Welcome to ${req.restaurantName.trim()} — experience the finest dining.`,
            keywords: [req.restaurantName.trim(), 'restaurant', req.city || 'restaurant'],
            ogImage: '', ogType: 'restaurant',
            structuredData: {
              '@context': 'https://schema.org', '@type': 'Restaurant',
              name: req.restaurantName.trim(),
              url: `https://${subdomain}.nexaros.in`,
            },
          },
          homeSections: [
            { type: 'hero', title: `Welcome to ${req.restaurantName.trim()}`, subtitle: 'Serving authentic flavours with passion', ctaText: 'View Menu', ctaLink: '#menu', backgroundImage: '' },
            { type: 'about', title: 'Our Story', content: `At ${req.restaurantName.trim()}, we serve fresh, delicious meals made with love.`, image: '' },
            { type: 'menu', title: 'Our Menu', displayMode: 'categories', showPrices: true, showImages: true },
            { type: 'reservation', title: 'Book a Table', subtitle: 'Reserve your spot for an unforgettable dining experience' },
            { type: 'reviews', title: 'What Our Customers Say', displayMode: 'carousel' },
            { type: 'contact', title: 'Get in Touch', phone: req.phone || req.ownerPhone || '', email: req.ownerEmail.trim(), address: req.address?.trim() || '' },
          ],
          socialLinks: { facebook: '', instagram: '', twitter: '', whatsapp: req.phone || req.ownerPhone || '', googleMaps: '' },
          legalPages: {
            privacyPolicy: { title: 'Privacy Policy', content: '', lastUpdated: new Date().toISOString() },
            termsOfService: { title: 'Terms of Service', content: '', lastUpdated: new Date().toISOString() },
            refundPolicy: { title: 'Refund & Cancellation Policy', content: '', lastUpdated: new Date().toISOString() },
            shippingPolicy: { title: 'Delivery & Shipping Policy', content: '', lastUpdated: new Date().toISOString() },
          },
          analytics: { googleAnalyticsId: '', facebookPixelId: '', hotjarId: '' },
          openingHours: {
            monday: { open: '09:00', close: '23:00', isOpen: true },
            tuesday: { open: '09:00', close: '23:00', isOpen: true },
            wednesday: { open: '09:00', close: '23:00', isOpen: true },
            thursday: { open: '09:00', close: '23:00', isOpen: true },
            friday: { open: '09:00', close: '00:00', isOpen: true },
            saturday: { open: '09:00', close: '00:00', isOpen: true },
            sunday: { open: '10:00', close: '23:00', isOpen: true },
          },
        },
      });

      this.emitProgress(req.id, 'categories', 'Creating menu categories...');
      const defaultCategories = [
        { name: 'Starters', sortOrder: 0 }, { name: 'Soups', sortOrder: 1 },
        { name: 'Main Course', sortOrder: 2 }, { name: 'Biryani & Rice', sortOrder: 3 },
        { name: 'Breads', sortOrder: 4 }, { name: 'Beverages', sortOrder: 5 },
        { name: 'Desserts', sortOrder: 6 }, { name: 'Combos', sortOrder: 7 },
      ];
      await tx.category.createMany({
        data: defaultCategories.map((c) => ({
          tenantId: tenant.id, name: c.name, sortOrder: c.sortOrder, isActive: true,
        })),
      });

      this.emitProgress(req.id, 'tables', 'Setting up tables...');
      const qrBaseUrl = `https://${subdomain}.nexaros.in/order`;
      await tx.restaurantTable.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          branchId: branch.id, number: i + 1, name: `T${i + 1}`,
          capacity: i < 2 ? 8 : 4, status: 'FREE' as const,
          qrCode: `${qrBaseUrl}/${branch.id}/${i + 1}`, isActive: true,
        })),
      });

      this.emitProgress(req.id, 'shifts', 'Configuring shifts...');
      await tx.shift.createMany({
        data: [
          { branchId: branch.id, name: 'Morning Shift', startTime: '09:00', endTime: '17:00', createdBy: adminUserId },
          { branchId: branch.id, name: 'Evening Shift', startTime: '17:00', endTime: '23:00', createdBy: adminUserId },
          { branchId: branch.id, name: 'Night Shift', startTime: '23:00', endTime: '02:00', createdBy: adminUserId },
        ],
      });

      this.emitProgress(req.id, 'membership', 'Creating membership tiers...');
      await tx.membershipTier.createMany({
        data: [
          { tenantId: tenant.id, name: 'Bronze', minSpent: 0, minOrders: 0, discountPct: 0, pointsMultiplier: 1, color: '#CD7F32', sortOrder: 0, isActive: true, createdBy: adminUserId },
          { tenantId: tenant.id, name: 'Silver', minSpent: 5000, minOrders: 10, discountPct: 5, pointsMultiplier: 1.5, color: '#C0C0C0', sortOrder: 1, isActive: true, createdBy: adminUserId },
          { tenantId: tenant.id, name: 'Gold', minSpent: 20000, minOrders: 50, discountPct: 10, pointsMultiplier: 2, color: '#FFD700', sortOrder: 2, isActive: true, createdBy: adminUserId },
        ],
      });

      this.emitProgress(req.id, 'tax', 'Setting up tax rates...');
      await tx.taxSetting.createMany({
        data: [
          { tenantId: tenant.id, name: 'GST 5%', rate: 5, type: 'GST', hsnCode: '9963', isDefault: true, isActive: true },
          { tenantId: tenant.id, name: 'GST 12%', rate: 12, type: 'GST', hsnCode: '9963', isDefault: false, isActive: true },
          { tenantId: tenant.id, name: 'GST 18%', rate: 18, type: 'GST', hsnCode: '9963', isDefault: false, isActive: true },
          { tenantId: tenant.id, name: 'GST 0% (Exempt)', rate: 0, type: 'GST', hsnCode: '9963', isDefault: false, isActive: true },
        ],
      });

      this.emitProgress(req.id, 'featureflags', 'Enabling feature flags...');
      if (allFeatureFlags.length > 0) {
        await tx.tenantFeatureFlag.createMany({
          data: allFeatureFlags.map((ff: any) => ({
            tenantId: tenant.id, featureFlagId: ff.id,
            enabled: ff.enabled && entitlements[ff.key] !== false,
          })),
        });
      }

      this.emitProgress(req.id, 'settings', 'Applying settings...');
      const defaultSettings = [
        { key: 'business.name', value: req.restaurantName.trim(), category: 'general' },
        { key: 'business.phone', value: req.phone || req.ownerPhone || '', category: 'general' },
        { key: 'business.email', value: req.ownerEmail.trim(), category: 'general' },
        { key: 'business.timezone', value: req.timezone || 'Asia/Kolkata', category: 'general' },
        { key: 'business.currency', value: req.currency || 'INR', category: 'general' },
        { key: 'business.country', value: req.country || 'India', category: 'general' },
        { key: 'pos.receipt_footer', value: `Thank you for dining at ${req.restaurantName.trim()}!`, category: 'pos' },
        { key: 'orders.auto_accept', value: false, category: 'orders' },
        { key: 'orders.prep_time_minutes', value: 15, category: 'orders' },
        { key: 'inventory.low_stock_threshold', value: 10, category: 'inventory' },
        { key: 'website.enabled', value: true, category: 'website' },
        { key: 'notifications.email_enabled', value: true, category: 'notifications' },
        { key: 'notifications.sms_enabled', value: false, category: 'notifications' },
        { key: 'notifications.push_enabled', value: false, category: 'notifications' },
        { key: 'payments.default_method', value: 'CASH', category: 'payments' },
        { key: 'payments.enable_online', value: true, category: 'payments' },
        { key: 'payments.gateway', value: 'razorpay', category: 'payments' },
        { key: 'invoices.prefix', value: 'INV', category: 'invoices' },
        { key: 'invoices.auto_generate', value: true, category: 'invoices' },
        { key: 'invoices.gst_enabled', value: true, category: 'invoices' },
        { key: 'dashboard.default_view', value: 'daily', category: 'dashboard' },
        { key: 'dashboard.refresh_interval', value: 30, category: 'dashboard' },
        { key: 'reports.default_period', value: 'today', category: 'reports' },
        { key: 'reports.auto_generate_daily', value: true, category: 'reports' },
      ];
      await tx.tenantSetting.createMany({
        data: defaultSettings.map((s) => ({ tenantId: tenant.id, ...s })),
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id, userId: ownerUser.id, action: 'TENANT_CREATED',
          entity: 'Tenant', entityId: tenant.id,
          newData: { name: tenant.name, slug: tenant.slug, subdomain: tenant.subdomain, plan: plan?.name || 'None', provisionedBy: adminUserId },
          ipAddress: ip || null,
        },
      });

      return { tenant, branch, owner: ownerUser, staff, subscription, plan };
    });
  }

  // ── Provision Branch Only (under existing tenant) ──
  private async provisionBranch(
    req: any, ownerProfile: any, plan: any, adminUserId: string,
    ip: string | undefined, steps: typeof BRANCH_ONLY_STEPS,
  ) {
    const tenantId = req.existingTenantId;
    if (!tenantId) throw new BadRequestException('Existing tenant ID is required');

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException('Business not found');

    // Check plan limits
    if (plan && plan.maxBranches) {
      const branchCount = await this.prisma.branch.count({
        where: { tenantId, deletedAt: null },
      });
      if (branchCount >= plan.maxBranches) {
        throw new BadRequestException(
          `Branch limit reached (${plan.maxBranches}). Upgrade your plan to add more branches.`,
        );
      }
    }

    const now = new Date();
    const trialDays = plan?.trialDays || 14;
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const entitlements = plan
      ? Object.fromEntries(
          (await this.prisma.planEntitlement.findMany({ where: { planId: plan.id } })).map(
            (e: any) => [e.moduleKey, e.enabled],
          ),
        )
      : {};

    const branchName = req.branchName || `${tenant.name} - Branch ${(await this.prisma.branch.count({ where: { tenantId, deletedAt: null } })) + 1}`;
    const subdomain = tenant.subdomain || tenant.slug;

    return this.prisma.$transaction(async (tx) => {
      this.emitProgress(req.id, 'branch', 'Setting up branch...');
      const branch = await tx.branch.create({
        data: {
          tenantId,
          name: branchName,
          displayName: branchName,
          address: req.address?.trim() || tenant.address || null,
          city: req.city?.trim() || tenant.city || null,
          state: req.state?.trim() || tenant.state || null,
          country: req.country || tenant.country || 'India',
          phone: req.phone || tenant.phone || null,
          branchType: 'SECONDARY',
          isPrimary: false,
          isActive: true,
          status: 'ACTIVE',
        },
      });

      // ── Find or create the owner's user + staff record on the new branch ──
      let ownerUser: any = null;
      let staff: any = null;

      if (ownerProfile) {
        this.emitProgress(req.id, 'owner', 'Linking owner account...');
        ownerUser = await tx.user.findFirst({
          where: { tenantId, email: ownerProfile.email, deletedAt: null },
        });

        if (!ownerUser) {
          const hashedPassword = await bcrypt.hash(req.password || this.generatePassword(), 10);
          ownerUser = await tx.user.create({
            data: {
              tenantId,
              email: ownerProfile.email,
              phone: ownerProfile.phone || req.ownerPhone?.trim() || null,
              password: hashedPassword,
              firstName: ownerProfile.name?.split(' ')[0] || 'Owner',
              lastName: ownerProfile.name?.split(' ').slice(1).join(' ') || '',
              role: 'OWNER',
              isActive: true,
            },
          });
        }

        this.emitProgress(req.id, 'staff', 'Linking staff record...');
        staff = await tx.staff.findFirst({
          where: { tenantId, userId: ownerUser.id, deletedAt: null },
        });

        if (!staff) {
          const ownerRole = await tx.role.findFirst({
            where: { tenantId, isSystem: true, name: 'Owner' },
          });
          staff = await tx.staff.create({
            data: {
              tenantId,
              branchId: branch.id,
              userId: ownerUser.id,
              roleId: ownerRole?.id || '',
              name: ownerProfile.name,
              phone: ownerProfile.phone || req.ownerPhone?.trim() || null,
              status: 'ACTIVE',
              isActive: true,
            },
          });
        }
      }

      this.emitProgress(req.id, 'subscription', 'Activating subscription...');
      let subscription = null;
      if (plan) {
        const isFreePlan = Number(plan.price) === 0;
        const isCustomPaid = (plan.isCustom || plan.slug?.toLowerCase().includes('enterprise')) && Number(req.customAmount) > 0;
        const treatAsPaid = !isFreePlan || isCustomPaid;
        subscription = await tx.subscription.create({
          data: {
            tenantId,
            branchId: branch.id,
            planId: plan.id,
            status: treatAsPaid ? 'ACTIVE' : 'TRIAL',
            entitlements,
            trialStartedAt: now, trialEndsAt,
            currentPeriodStart: now,
            currentPeriodEnd: treatAsPaid ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : trialEndsAt,
            nextBillingDate: treatAsPaid ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : trialEndsAt,
            gracePeriodDays: 7,
          },
        });
      }

      this.emitProgress(req.id, 'tables', 'Setting up tables...');
      const qrBaseUrl = `https://${subdomain}.nexaros.in/order`;
      await tx.restaurantTable.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          branchId: branch.id, number: i + 1, name: `T${i + 1}`,
          capacity: i < 2 ? 8 : 4, status: 'FREE' as const,
          qrCode: `${qrBaseUrl}/${branch.id}/${i + 1}`, isActive: true,
        })),
      });

      this.emitProgress(req.id, 'shifts', 'Configuring shifts...');
      await tx.shift.createMany({
        data: [
          { branchId: branch.id, name: 'Morning Shift', startTime: '09:00', endTime: '17:00', createdBy: adminUserId },
          { branchId: branch.id, name: 'Evening Shift', startTime: '17:00', endTime: '23:00', createdBy: adminUserId },
          { branchId: branch.id, name: 'Night Shift', startTime: '23:00', endTime: '02:00', createdBy: adminUserId },
        ],
      });

      await tx.auditLog.create({
        data: {
          tenantId, userId: ownerUser?.id || adminUserId, action: 'BRANCH_CREATED',
          entity: 'Branch', entityId: branch.id,
          newData: { name: branch.name, tenant: tenant.name, plan: plan?.name || 'None', provisionedBy: adminUserId },
          ipAddress: ip || null,
        },
      });

      return { tenant, branch, owner: ownerUser, staff, subscription, plan };
    });
  }

  // ── Preview Provisioning ──
  async previewProvisioning(requestId: string) {
    const request = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Provision request not found');

    const mode = request.mode || 'new_business';
    const slug = (request.restaurantName || '')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let subdomain = request.subdomain?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || slug;
    subdomain = subdomain.replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    if (!subdomain) subdomain = slug;

    const plan = request.planId
      ? await this.prisma.platformPlan.findUnique({ where: { id: request.planId } })
      : await this.prisma.platformPlan.findFirst({ where: { slug: 'starter-free', isActive: true } });

    const entitlements = plan
      ? Object.fromEntries(
          (await this.prisma.planEntitlement.findMany({ where: { planId: plan.id } })).map(
            (e: any) => [e.moduleKey, e.enabled],
          ),
        )
      : {};

    const trialDays = plan?.trialDays || 14;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const isFree = !plan || Number(plan.price) === 0;

    // For add_branch mode, show existing tenant info
    let existingTenant = null;
    if (mode === 'add_branch' && request.existingTenantId) {
      existingTenant = await this.prisma.tenant.findFirst({
        where: { id: request.existingTenantId },
        select: { id: true, name: true, slug: true, city: true, state: true },
      });
    }

    const enabledModules: Record<string, boolean> = {
      dashboard: true, orders: true, pos: true, kitchen: entitlements['kitchen'] !== false,
      tables: true, menu: true, categories: true, inventory: entitlements['inventory'] !== false,
      suppliers: entitlements['suppliers'] !== false, purchases: entitlements['purchases'] !== false,
      payments: true, invoices: true, finance: entitlements['finance'] !== false,
      staff: true, attendance: entitlements['attendance'] !== false,
      shifts: true, customers: true, reservations: entitlements['reservations'] !== false,
      reviews: true, feedback: true, coupons: entitlements['coupons'] !== false,
      campaigns: entitlements['campaigns'] !== false, loyalty: entitlements['loyalty'] !== false,
      offers: entitlements['offers'] !== false, reports: true, analytics: entitlements['analytics'] !== false,
      branches: true, settings: true, website: entitlements['website'] !== false,
      notifications: true, ai: entitlements['ai'] !== false,
      delivery: entitlements['delivery'] !== false, crm: entitlements['crm'] !== false,
      cms: entitlements['cms'] !== false, omnichannel: entitlements['omnichannel'] !== false,
    };

    const moduleCount = Object.values(enabledModules).filter(Boolean).length;

    return {
      requestId,
      mode,
      existingTenant,
      restaurant: {
        name: request.restaurantName,
        slug,
        subdomain: `${subdomain}.nexaros.in`,
        address: request.address || 'Not specified',
        city: request.city || 'Not specified',
        state: request.state || 'Not specified',
        country: request.country || 'India',
        cuisineType: request.cuisineType || 'Multi-Cuisine',
        phone: request.phone || 'Not specified',
        email: request.email || request.ownerEmail,
        timezone: request.timezone || 'Asia/Kolkata',
        currency: request.currency || 'INR',
      },
      owner: {
        name: request.ownerName,
        email: request.ownerEmail,
        phone: request.ownerPhone || 'Not specified',
      },
      branch: { name: request.branchName || 'Main Branch', address: request.address || 'Not specified' },
      subscription: {
        plan: plan?.name || 'Starter Free',
        planId: plan?.id || null,
        billingCycle: request.billingCycle || 'MONTHLY',
        isFree,
        trialDays,
        trialEndsAt: trialEndsAt.toISOString(),
        status: isFree ? 'TRIAL' : 'ACTIVE (after payment)',
      },
      payment: {
        required: !isFree,
        status: isFree ? 'NOT_REQUIRED' : request.paymentStatus || 'PENDING',
        provider: request.paymentProvider || 'razorpay',
        amount: Number(request.totalAmount || 0),
        currency: request.currencyCode || 'INR',
      },
      modules: enabledModules,
      moduleCount,
      resources: mode === 'new_business' ? {
        permissions: 140, roles: 6, categories: 8, tables: 10, shifts: 3,
        membershipTiers: 3, taxRates: 4,
        featureFlags: (await this.prisma.featureFlag.findMany()).length, settings: 24,
      } : {
        tables: 10, shifts: 3,
      },
      estimatedTime: mode === 'new_business' ? '~15 seconds' : '~5 seconds',
    };
  }

  // ── Get Request Status / Progress ──
  async getProgress(requestId: string) {
    const request = await this.prisma.restaurantProvisionRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Provision request not found');
    return {
      id: request.id,
      status: request.status,
      ownerEmail: request.ownerEmail,
      restaurantName: request.restaurantName,
      progress: request.progress || { step: 0, message: 'No progress', completedSteps: [], currentStep: '' },
      mode: request.mode || 'new_business',
      error: request.error,
    };
  }

  // ── Get Request by Token ──
  async getByToken(token: string) {
    const request = await this.prisma.restaurantProvisionRequest.findFirst({
      where: { id: token, status: { not: 'COMPLETED' } },
    });
    if (!request) throw new NotFoundException('Provision request not found');
    return request;
  }

  // ── Helpers ──
  private emitProgress(requestId: string, stepKey: string, message: string) {
    try {
      this.gateway.emitToRoomPublic(`provision:${requestId}`, 'provision.progress', {
        stepKey, message, timestamp: new Date().toISOString(),
      });
    } catch (e) {
      this.logger.warn(`Failed to emit progress: ${(e as Error).message}`);
    }
  }

  private emitRealtimeEvents(req: any, result: any) {
    try {
      const eventData = {
        tenantId: result.tenant.id,
        restaurantName: result.tenant.name,
        slug: result.tenant.slug,
        subdomain: result.tenant.subdomain,
        plan: result.plan?.name || 'Free',
        timestamp: new Date().toISOString(),
      };

      this.gateway.emitToRoomPublic('admin:dashboard', 'restaurant.created', eventData);
      this.gateway.emitToRoomPublic('admin:dashboard', 'provision.completed', eventData);

      if (result.subscription) {
        this.gateway.emitToRoomPublic('admin:dashboard', 'subscription.created', {
          ...eventData,
          subscriptionId: result.subscription.id,
          plan: result.plan?.name,
          status: result.subscription.status,
        });
      }
    } catch (e) {
      this.logger.warn(`Failed to emit real-time events: ${(e as Error).message}`);
    }
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private getDefaultPermissions() {
    const modules = [
      'dashboard', 'orders', 'pos', 'kitchen', 'tables', 'menu', 'categories',
      'inventory', 'suppliers', 'purchases', 'payments', 'invoices', 'finance',
      'staff', 'attendance', 'shifts', 'leaves', 'payroll',
      'customers', 'reservations', 'reviews', 'feedback',
      'coupons', 'campaigns', 'loyalty', 'offers',
      'reports', 'analytics', 'branches', 'settings',
      'website', 'notifications', 'delivery', 'crm', 'cms',
      'ai', 'omnichannel', 'api_keys', 'webhooks',
    ];
    const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage'];
    const permissions: { module: string; action: string; description: string }[] = [];
    for (const module of modules) {
      for (const action of actions) {
        permissions.push({
          module,
          action,
          description: `Can ${action} ${module}`,
        });
      }
    }
    return permissions;
  }

  private getDefaultRoleDefinitions(allPermissions: any[]) {
    const permMap = new Map(allPermissions.map((p: any) => [`${p.module}:${p.action}`, p.id]));

    const getIds = (moduleActions: string[]) =>
      moduleActions.map((ma) => permMap.get(ma)).filter(Boolean) as string[];

    return [
      {
        name: 'Owner',
        description: 'Full access to all features',
        permissionIds: allPermissions.map((p: any) => p.id),
      },
      {
        name: 'Manager',
        description: 'Manage daily operations',
        permissionIds: getIds([
          'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:approve',
          'pos:view', 'pos:create', 'kitchen:view',
          'tables:view', 'tables:create', 'tables:edit',
          'menu:view', 'menu:edit', 'categories:view',
          'inventory:view', 'inventory:create', 'inventory:edit',
          'staff:view', 'staff:create', 'staff:edit',
          'shifts:view', 'shifts:create', 'shifts:edit',
          'payments:view', 'payments:create', 'invoices:view',
          'customers:view', 'reservations:view', 'reservations:create',
          'reports:view', 'analytics:view',
          'settings:view', 'settings:edit',
          'attendance:view', 'attendance:create', 'attendance:edit',
          'leaves:view', 'leaves:approve',
        ]),
      },
      {
        name: 'Supervisor',
        description: 'Supervise floor operations',
        permissionIds: getIds([
          'dashboard:view', 'orders:view', 'orders:edit',
          'tables:view', 'tables:edit',
          'kitchen:view', 'staff:view',
          'shifts:view', 'attendance:view',
          'customers:view', 'reservations:view',
          'reports:view',
        ]),
      },
      {
        name: 'Cashier',
        description: 'Handle payments and billing',
        permissionIds: getIds([
          'dashboard:view', 'orders:view', 'orders:create', 'orders:edit',
          'payments:view', 'payments:create', 'invoices:view', 'invoices:create',
          'tables:view', 'tables:edit',
          'customers:view',
        ]),
      },
      {
        name: 'Chef',
        description: 'Kitchen operations and order management',
        permissionIds: getIds([
          'kitchen:view', 'orders:view', 'orders:edit',
          'menu:view', 'categories:view',
          'inventory:view', 'inventory:edit',
        ]),
      },
      {
        name: 'Kitchen Staff',
        description: 'View and update order status',
        permissionIds: getIds([
          'kitchen:view', 'orders:view', 'orders:edit',
          'menu:view',
        ]),
      },
      {
        name: 'Waiter',
        description: 'Take orders and serve customers',
        permissionIds: getIds([
          'dashboard:view', 'orders:view', 'orders:create',
          'tables:view', 'tables:edit',
          'menu:view', 'categories:view',
          'customers:view',
        ]),
      },
      {
        name: 'Delivery Staff',
        description: 'View and manage deliveries',
        permissionIds: getIds([
          'delivery:view', 'delivery:create', 'delivery:edit',
          'orders:view',
        ]),
      },
    ];
  }
}
