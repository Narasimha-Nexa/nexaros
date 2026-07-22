import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly SESSION_TTL_HOURS = 24;

  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  async start(dto: { ipAddress?: string; userAgent?: string }) {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_TTL_HOURS);

    const session = await this.prisma.onboardingSession.create({
      data: {
        token,
        status: 'IN_PROGRESS',
        expiresAt,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });

    return {
      token: session.token,
      status: session.status,
      expiresAt: session.expiresAt,
    };
  }

  async getStatus(token: string) {
    const session = await this.prisma.onboardingSession.findUnique({
      where: { token },
      include: { plan: true },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    if (session.expiresAt < new Date() && session.status !== 'COMPLETED') {
      await this.prisma.onboardingSession.update({
        where: { token },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Onboarding session has expired. Please start again.');
    }

    return {
      token: session.token,
      status: session.status,
      restaurantName: session.restaurantName,
      ownerEmail: session.ownerEmail,
      plan: session.plan,
      billingCycle: session.billingCycle,
      paymentStatus: session.paymentStatus,
      expiresAt: session.expiresAt,
    };
  }

  async updateRestaurant(token: string, dto: {
    restaurantName: string;
    brandName?: string;
    businessType?: string;
    gstNumber?: string;
    fssaiLicense?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    timezone?: string;
    currency?: string;
    restaurantLogo?: string;
  }) {
    const session = await this.validateSession(token);

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Onboarding already completed');
    }

    if (session.status === 'CANCELLED' || session.status === 'EXPIRED') {
      throw new BadRequestException('Onboarding session is no longer valid');
    }

    return this.prisma.onboardingSession.update({
      where: { token },
      data: {
        restaurantName: dto.restaurantName.trim(),
        brandName: dto.brandName?.trim() || null,
        businessType: dto.businessType?.trim() || null,
        gstNumber: dto.gstNumber?.trim() || null,
        fssaiLicense: dto.fssaiLicense?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        country: dto.country?.trim() || 'India',
        postalCode: dto.postalCode?.trim() || null,
        timezone: dto.timezone?.trim() || 'Asia/Kolkata',
        currency: dto.currency?.trim() || 'INR',
        restaurantLogo: dto.restaurantLogo?.trim() || null,
      },
    });
  }

  async updateOwner(token: string, dto: {
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    password: string;
  }) {
    const session = await this.validateSession(token);

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Onboarding already completed');
    }

    if (session.status === 'CANCELLED' || session.status === 'EXPIRED') {
      throw new BadRequestException('Onboarding session is no longer valid');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.ownerEmail.trim() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.onboardingSession.update({
      where: { token },
      data: {
        ownerName: dto.ownerName.trim(),
        ownerEmail: dto.ownerEmail.trim(),
        ownerPhone: dto.ownerPhone?.trim() || null,
        passwordHash,
      },
    });
  }

  async updateSettings(token: string, dto: {
    taxMode?: string;
    billingPrefs?: Record<string, any>;
    kitchenSettings?: Record<string, any>;
    shiftTimings?: Record<string, any>;
    defaultPrinter?: string;
    language?: string;
    theme?: string;
    dateFormat?: string;
    timeFormat?: string;
    websitePrefs?: Record<string, any>;
  }) {
    const session = await this.validateSession(token);

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Onboarding already completed');
    }

    if (session.status === 'CANCELLED' || session.status === 'EXPIRED') {
      throw new BadRequestException('Onboarding session is no longer valid');
    }

    return this.prisma.onboardingSession.update({
      where: { token },
      data: {
        taxMode: dto.taxMode?.trim() || undefined,
        ...(dto.billingPrefs ? { billingPrefs: dto.billingPrefs } : {}),
        ...(dto.kitchenSettings ? { kitchenSettings: dto.kitchenSettings } : {}),
        ...(dto.shiftTimings ? { shiftTimings: dto.shiftTimings } : {}),
        defaultPrinter: dto.defaultPrinter?.trim() || undefined,
        language: dto.language?.trim() || 'en',
        theme: dto.theme?.trim() || 'light',
        dateFormat: dto.dateFormat?.trim() || 'DD/MM/YYYY',
        timeFormat: dto.timeFormat?.trim() || '12h',
        ...(dto.websitePrefs ? { websitePrefs: dto.websitePrefs } : {}),
      },
    });
  }

  async selectPlan(token: string, dto: { planId: string; billingCycle?: string; couponCode?: string }) {
    const session = await this.validateSession(token);

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Onboarding already completed');
    }

    if (session.status === 'CANCELLED' || session.status === 'EXPIRED') {
      throw new BadRequestException('Onboarding session is no longer valid');
    }

    const plan = await this.prisma.platformPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan || !plan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    return this.prisma.onboardingSession.update({
      where: { token },
      data: {
        planId: plan.id,
        billingCycle: dto.billingCycle || 'MONTHLY',
        couponCode: dto.couponCode?.trim() || null,
        status: Number(plan.price) > 0 ? 'PAYMENT_PENDING' : 'READY_TO_COMPLETE',
      },
      include: { plan: true },
    });
  }

  async createPaymentOrder(token: string, couponCode?: string) {
    const session = await this.validateSession(token);

    if (session.status !== 'PAYMENT_PENDING') {
      throw new BadRequestException('Payment is not required for this session');
    }

    if (!session.planId) {
      throw new BadRequestException('No plan selected');
    }

    const checkout = await this.billingService.createCheckout(
      undefined,
      session.planId,
      couponCode,
      session.ownerEmail!,
      session.ownerPhone || undefined,
    );

    await this.prisma.onboardingSession.update({
      where: { token },
      data: { paymentOrderId: checkout.orderId },
    });

    return {
      orderId: checkout.orderId,
      amount: checkout.amount,
      originalAmount: checkout.originalAmount,
      discount: checkout.discount,
      currency: checkout.currency,
      planId: checkout.planId,
      planSlug: checkout.planSlug,
    };
  }

  async verifyPayment(token: string, body: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const session = await this.validateSession(token);

    if (session.status !== 'PAYMENT_PENDING') {
      throw new BadRequestException('Payment is not pending for this session');
    }

    await this.billingService.verifyPaymentOnly(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
    );

    await this.prisma.onboardingSession.update({
      where: { token },
      data: {
        paymentOrderId: body.razorpayOrderId,
        paymentId: body.razorpayPaymentId,
        paymentStatus: 'COMPLETED',
        status: 'READY_TO_COMPLETE',
      },
    });

    return { success: true, message: 'Payment verified successfully' };
  }

  async complete(token: string, dto: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) {
    const session = await this.validateSession(token);

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Onboarding already completed');
    }

    if (session.status === 'CANCELLED' || session.status === 'EXPIRED') {
      throw new BadRequestException('Onboarding session is no longer valid');
    }

    if (!session.restaurantName || !session.ownerEmail || !session.ownerName) {
      throw new BadRequestException('Please complete all required steps before finalizing');
    }

    if (!session.planId) {
      throw new BadRequestException('Please select a plan');
    }

    if (!session.passwordHash) {
      throw new BadRequestException('Owner password is missing. Please restart onboarding.');
    }

    const {
      restaurantName,
      brandName,
      businessType,
      gstNumber,
      fssaiLicense,
      address,
      city,
      state,
      country,
      postalCode,
      timezone,
      currency,
      restaurantLogo,
      ownerName,
      ownerEmail,
      ownerPhone,
      passwordHash,
      taxMode,
      shiftTimings,
      defaultPrinter,
      language,
      theme,
      dateFormat,
      timeFormat,
      couponCode,
      paymentOrderId,
      paymentId,
      ipAddress,
    } = session;

    const plan = await this.prisma.platformPlan.findUnique({
      where: { id: session.planId },
      include: { entitlements: true },
    });

    if (!plan) {
      throw new BadRequestException('Selected plan is no longer available');
    }

    if (Number(plan.price) > 0) {
      if (!dto.razorpayOrderId || !dto.razorpayPaymentId || !dto.razorpaySignature) {
        throw new BadRequestException('Payment verification is required for paid plans');
      }

      const paymentVerified = await this.billingService.verifyPaymentOnly(
        dto.razorpayOrderId,
        dto.razorpayPaymentId,
        dto.razorpaySignature,
      );

      if (!paymentVerified.success) {
        throw new BadRequestException('Payment verification failed');
      }

      await this.prisma.onboardingSession.update({
        where: { token },
        data: {
          paymentOrderId: dto.razorpayOrderId,
          paymentId: dto.razorpayPaymentId,
          paymentStatus: 'COMPLETED',
        },
      });
    }

    const now = new Date();
    const trialDays = plan.trialDays || 14;
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const slug = restaurantName!
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSlug = await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    let subdomain = restaurantName!
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const existingSubdomain = await this.prisma.tenant.findFirst({ where: { subdomain, deletedAt: null } });
    if (existingSubdomain) {
      subdomain = `${subdomain}-${Date.now().toString(36)}`;
    }

    const entitlements = plan.entitlements
      ? Object.fromEntries(plan.entitlements.map((e) => [e.moduleKey, e.enabled]))
      : {};

    const allFeatureFlags = await this.prisma.featureFlag.findMany();

    // Create or find OwnerProfile for multi-tenant support
    let ownerProfile = await this.prisma.ownerProfile.findFirst({
      where: { email: ownerEmail!.trim().toLowerCase(), deletedAt: null },
    });
    if (!ownerProfile) {
      ownerProfile = await this.prisma.ownerProfile.create({
        data: {
          email: ownerEmail!.trim().toLowerCase(),
          phone: ownerPhone?.trim() || null,
          password: passwordHash!,
          name: ownerName!.trim(),
          isActive: true,
        },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          ownerProfileId: ownerProfile.id,
          name: restaurantName!.trim(),
          slug: finalSlug,
          subdomain,
          phone: ownerPhone || null,
          email: ownerEmail!.trim(),
          address: address?.trim() || null,
          gstNumber: gstNumber?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          country: country || 'India',
          timezone: timezone || 'Asia/Kolkata',
          currency: currency || 'INR',
          businessType: businessType?.trim() || null,
          logo: restaurantLogo || null,
          isActive: true,
          onboardingStatus: 'COMPLETED',
        },
      });

      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch',
          address: address?.trim() || null,
          phone: ownerPhone || null,
          isPrimary: true,
          isActive: true,
        },
      });

      const defaultPermissions = this.getDefaultPermissions();
      const permissions = await Promise.all(
        defaultPermissions.map((p) =>
          tx.permission.upsert({
            where: { module_action: { module: p.module, action: p.action } },
            update: {},
            create: p,
          }),
        ),
      );

      const ownerRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Owner',
          description: 'Full access to all features',
          isSystem: true,
          permissions: {
            create: permissions.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: ownerEmail!.trim(),
          phone: ownerPhone?.trim() || null,
          password: passwordHash!,
          firstName: ownerName!.trim(),
          lastName: '',
          role: 'OWNER',
          isActive: true,
        },
      });

      const staff = await tx.staff.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          userId: owner.id,
          roleId: ownerRole.id,
          name: ownerName!.trim(),
          phone: ownerPhone?.trim() || null,
          isActive: true,
        },
      });

      const roleDefs = this.getDefaultRoleDefinitions(permissions);
      for (const roleDef of roleDefs) {
        if (roleDef.name === 'Owner') continue;
        const dedupedIds = [...new Set(roleDef.permissionIds)].filter(Boolean) as string[];
        await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: roleDef.name,
            description: roleDef.description,
            isSystem: true,
            permissions: dedupedIds.length > 0
              ? { create: dedupedIds.map((pid: string) => ({ permissionId: pid })) }
              : undefined,
          },
        });
      }

      const subscription = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: Number(plan.price) > 0 ? 'ACTIVE' : 'TRIAL',
          entitlements,
          trialStartedAt: now,
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          nextBillingDate: trialEndsAt,
          gracePeriodDays: 7,
          lastPaymentAt: Number(plan.price) > 0 ? now : undefined,
        },
      });

      if (Number(plan.price) > 0 && paymentId) {
        await tx.subscriptionPayment.create({
          data: {
            subscriptionId: subscription.id,
            amount: Number(plan.price),
            method: 'ONLINE',
            reference: paymentId,
            status: 'COMPLETED',
          },
        });
      }

      const websiteConfig = await tx.tenantWebsiteConfig.create({
        data: {
          tenantId: tenant.id,
          restaurantName: restaurantName!.trim(),
          phone: ownerPhone || null,
          email: ownerEmail!.trim(),
          address: address?.trim() || null,
          primaryColor: '#E23744',
          secondaryColor: '#1A1A1A',
          accentColor: '#f59e0b',
          currency: currency || 'INR',
          timezone: timezone || 'Asia/Kolkata',
          features: { qrOrdering: true, onlineOrdering: true, reservations: true, gallery: true, reviews: true },
          seo: {
            title: `${restaurantName!.trim()} | Best Restaurant`,
            description: `Welcome to ${restaurantName!.trim()}`,
            keywords: [restaurantName!.trim(), 'restaurant'],
            ogType: 'restaurant',
          },
          homeSections: [
            { type: 'hero', title: `Welcome to ${restaurantName!.trim()}`, subtitle: 'Serving authentic flavours', ctaText: 'View Menu', ctaLink: '#menu' },
            { type: 'about', title: 'Our Story', content: `At ${restaurantName!.trim()}, we believe in fresh, delicious meals.` },
            { type: 'menu', title: 'Our Menu', displayMode: 'categories', showPrices: true, showImages: true },
            { type: 'gallery', title: 'Gallery', subtitle: 'A glimpse into our world', images: [] },
            { type: 'reservation', title: 'Book a Table', subtitle: 'Reserve your spot' },
            { type: 'reviews', title: 'What Our Customers Say', displayMode: 'carousel' },
            { type: 'contact', title: 'Get in Touch', subtitle: `Visit us at ${address || 'our restaurant'}`, phone: ownerPhone || '', email: ownerEmail!.trim(), address: address?.trim() || '' },
          ],
          socialLinks: { whatsapp: ownerPhone || '' },
          legalPages: {
            privacyPolicy: { title: 'Privacy Policy', content: `Privacy Policy for ${restaurantName!.trim()}` },
            termsOfService: { title: 'Terms of Service', content: `Terms of Service for ${restaurantName!.trim()}` },
            refundPolicy: { title: 'Refund & Cancellation Policy', content: 'Our refund policy' },
            shippingPolicy: { title: 'Delivery & Shipping Policy', content: 'Our delivery policy' },
          },
          analytics: { googleAnalyticsId: '', facebookPixelId: '', hotjarId: '' },
          openingHours: {
            monday: { open: '09:00', close: '23:00', isOpen: true, breakStart: '16:00', breakEnd: '18:00' },
            tuesday: { open: '09:00', close: '23:00', isOpen: true, breakStart: '16:00', breakEnd: '18:00' },
            wednesday: { open: '09:00', close: '23:00', isOpen: true, breakStart: '16:00', breakEnd: '18:00' },
            thursday: { open: '09:00', close: '23:00', isOpen: true, breakStart: '16:00', breakEnd: '18:00' },
            friday: { open: '09:00', close: '00:00', isOpen: true },
            saturday: { open: '09:00', close: '00:00', isOpen: true },
            sunday: { open: '10:00', close: '23:00', isOpen: true },
          },
        },
      });

      const defaultCategories = [
        { name: 'Starters', sortOrder: 0 },
        { name: 'Soups', sortOrder: 1 },
        { name: 'Main Course', sortOrder: 2 },
        { name: 'Biryani & Rice', sortOrder: 3 },
        { name: 'Breads', sortOrder: 4 },
        { name: 'Beverages', sortOrder: 5 },
        { name: 'Desserts', sortOrder: 6 },
        { name: 'Combos', sortOrder: 7 },
      ];

      await tx.category.createMany({
        data: defaultCategories.map((c) => ({
          tenantId: tenant.id,
          name: c.name,
          sortOrder: c.sortOrder,
          isActive: true,
        })),
      });

      const qrBaseUrl = `https://${subdomain}.nexaros.in/order`;
      const defaultTables = Array.from({ length: 10 }, (_, i) => ({
        branchId: branch.id,
        number: i + 1,
        name: `T${i + 1}`,
        capacity: i < 2 ? 8 : 4,
        status: 'FREE' as const,
        isActive: true,
        qrCode: `${qrBaseUrl}/${branch.id}/${i + 1}`,
      }));

      await tx.restaurantTable.createMany({ data: defaultTables });

      const defaultShifts = [
        { name: 'Morning Shift', startTime: '09:00', endTime: '17:00' },
        { name: 'Evening Shift', startTime: '17:00', endTime: '23:00' },
        { name: 'Night Shift', startTime: '23:00', endTime: '02:00' },
      ];

      await tx.shift.createMany({
        data: defaultShifts.map((s) => ({
          branchId: branch.id,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });

      const defaultTiers = [
        { name: 'Bronze', minSpent: 0, minOrders: 0, discountPct: 0, pointsMultiplier: 1, color: '#CD7F32', sortOrder: 0 },
        { name: 'Silver', minSpent: 5000, minOrders: 10, discountPct: 5, pointsMultiplier: 1.5, color: '#C0C0C0', sortOrder: 1 },
        { name: 'Gold', minSpent: 20000, minOrders: 50, discountPct: 10, pointsMultiplier: 2, color: '#FFD700', sortOrder: 2 },
      ];

      await tx.membershipTier.createMany({
        data: defaultTiers.map((t) => ({
          tenantId: tenant.id,
          name: t.name,
          description: `${t.name} tier members`,
          minSpent: t.minSpent,
          minOrders: t.minOrders,
          discountPct: t.discountPct,
          pointsMultiplier: t.pointsMultiplier,
          color: t.color,
          sortOrder: t.sortOrder,
          isActive: true,
        })),
      });

      const defaultTaxSettings = [
        { name: 'GST 5%', rate: 5, type: 'GST', hsnCode: '9963', isDefault: true },
        { name: 'GST 12%', rate: 12, type: 'GST', hsnCode: '9963', isDefault: false },
        { name: 'GST 18%', rate: 18, type: 'GST', hsnCode: '9963', isDefault: false },
        { name: 'GST 0% (Exempt)', rate: 0, type: 'GST', hsnCode: '9963', isDefault: false },
      ];

      await tx.taxSetting.createMany({
        data: defaultTaxSettings.map((t) => ({
          tenantId: tenant.id,
          name: t.name,
          rate: t.rate,
          type: t.type,
          hsnCode: t.hsnCode,
          isDefault: t.isDefault,
          isActive: true,
        })),
      });

      if (allFeatureFlags.length > 0) {
        await tx.tenantFeatureFlag.createMany({
          data: allFeatureFlags.map((ff) => ({
            tenantId: tenant.id,
            featureFlagId: ff.id,
            enabled: ff.enabled && entitlements[ff.key] !== false,
          })),
        });
      }

      const defaultSettings = [
        { key: 'business.name', value: restaurantName!.trim(), category: 'general' },
        { key: 'business.phone', value: ownerPhone || '', category: 'general' },
        { key: 'business.email', value: ownerEmail!.trim(), category: 'general' },
        { key: 'business.timezone', value: timezone || 'Asia/Kolkata', category: 'general' },
        { key: 'business.currency', value: currency || 'INR', category: 'general' },
        { key: 'business.country', value: country || 'India', category: 'general' },
        { key: 'pos.receipt_footer', value: `Thank you for dining at ${restaurantName!.trim()}!`, category: 'pos' },
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
        { key: 'payments.qr_enabled', value: true, category: 'payments' },
        { key: 'invoices.prefix', value: 'INV', category: 'invoices' },
        { key: 'invoices.auto_generate', value: true, category: 'invoices' },
        { key: 'invoices.gst_enabled', value: true, category: 'invoices' },
        { key: 'invoices.digit_count', value: 6, category: 'invoices' },
        { key: 'dashboard.default_view', value: 'daily', category: 'dashboard' },
        { key: 'dashboard.refresh_interval', value: 30, category: 'dashboard' },
        { key: 'dashboard.show_low_stock', value: true, category: 'dashboard' },
        { key: 'dashboard.show_recent_orders', value: true, category: 'dashboard' },
        { key: 'reports.default_period', value: 'today', category: 'reports' },
        { key: 'reports.date_format', value: 'DD/MM/YYYY', category: 'reports' },
        { key: 'reports.auto_generate_daily', value: true, category: 'reports' },
        { key: 'reports.export_format', value: 'PDF', category: 'reports' },
        { key: 'notifications.welcome_subject', value: `Welcome to ${restaurantName!.trim()}!`, category: 'notifications' },
        { key: 'notifications.order_confirmation_subject', value: 'Order Confirmed - {orderNumber}', category: 'notifications' },
        { key: 'notifications.order_ready_subject', value: 'Your Order is Ready!', category: 'notifications' },
        { key: 'notifications.delivery_update_subject', value: 'Delivery Update - {orderNumber}', category: 'notifications' },
        { key: 'notifications.reservation_reminder_subject', value: 'Reservation Reminder - {date}', category: 'notifications' },
      ];

      await tx.tenantSetting.createMany({
        data: defaultSettings.map((s) => ({
          tenantId: tenant.id,
          key: s.key,
          value: s.value,
          category: s.category,
        })),
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: owner.id,
          action: 'TENANT_CREATED',
          entity: 'Tenant',
          entityId: tenant.id,
          newData: {
            name: tenant.name,
            slug: tenant.slug,
            subdomain: tenant.subdomain,
            plan: plan.name,
            provisionedBy: 'onboarding',
          },
          ipAddress: ipAddress || null,
        },
      });

      return {
        tenant,
        branch,
        owner,
        staff,
        subscription,
        plan,
        websiteConfig,
      };
    });

    await this.prisma.onboardingSession.update({
      where: { token },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    return {
      restaurant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        subdomain: result.tenant.subdomain,
        address: result.tenant.address,
        city: result.tenant.city,
        state: result.tenant.state,
        country: result.tenant.country,
        timezone: result.tenant.timezone,
        currency: result.tenant.currency,
      },
      branch: {
        id: result.branch.id,
        name: result.branch.name,
      },
      owner: {
        id: result.owner.id,
        name: `${result.owner.firstName} ${result.owner.lastName}`.trim(),
        email: result.owner.email,
        phone: result.owner.phone,
      },
      subscription: {
        id: result.subscription.id,
        plan: result.plan.name,
        status: result.subscription.status,
        trialEndsAt: result.subscription.trialEndsAt,
      },
    };
  }

  async cancel(token: string) {
    const session = await this.prisma.onboardingSession.findUnique({
      where: { token },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Onboarding already completed');
    }

    await this.prisma.onboardingSession.update({
      where: { token },
      data: { status: 'CANCELLED' },
    });

    return { success: true, message: 'Onboarding cancelled' };
  }

  private async validateSession(token: string) {
    const session = await this.prisma.onboardingSession.findUnique({
      where: { token },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    if (session.expiresAt < new Date() && session.status !== 'COMPLETED') {
      await this.prisma.onboardingSession.update({
        where: { token },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Onboarding session has expired. Please start again.');
    }

    return session;
  }

  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private getDefaultPermissions() {
    const modules = [
      'dashboard', 'orders', 'pos', 'kitchen', 'tables', 'menu', 'categories',
      'inventory', 'suppliers', 'purchases', 'payments', 'invoices', 'finance',
      'staff', 'attendance', 'shifts', 'customers', 'reservations', 'reviews',
      'feedback', 'coupons', 'campaigns', 'loyalty', 'offers', 'reports',
      'analytics', 'branches', 'settings', 'website', 'notifications',
      'ai', 'delivery', 'crm', 'cms', 'omnichannel',
    ];

    const actions = ['create', 'read', 'update', 'delete'];
    const permissions: { module: string; action: string; description: string }[] = [];

    for (const mod of modules) {
      for (const action of actions) {
        permissions.push({
          module: mod,
          action,
          description: `${action} ${mod}`,
        });
      }
    }

    return permissions;
  }

  private getDefaultRoleDefinitions(allPermissions: Array<{ id: string; module: string; action: string }>) {
    const permMap = new Map<string, string>();
    for (const p of allPermissions) {
      permMap.set(`${p.module}:${p.action}`, p.id);
    }

    const has = (mod: string, act: string) => permMap.get(`${mod}:${act}`);
    const allOf = (mod: string, actions: string[]) => actions.map(a => has(mod, a)).filter(Boolean) as string[];
    const allMod = (mods: string[], actions: string[]) =>
      mods.flatMap(m => actions.map(a => has(m, a))).filter(Boolean) as string[];
    const allCrud = (mods: string[]) => allMod(mods, ['create', 'read', 'update', 'delete']);
    const allRead = (mods: string[]) => allMod(mods, ['read']);
    const allReadWrite = (mods: string[]) => allMod(mods, ['read', 'update']);
    const allCud = (mods: string[]) => allMod(mods, ['create', 'update', 'delete']);

    return [
      {
        name: 'Owner',
        description: 'Full access to all features',
        permissionIds: allCrud([
          'dashboard', 'orders', 'pos', 'kitchen', 'tables', 'menu', 'categories',
          'inventory', 'suppliers', 'purchases', 'payments', 'invoices', 'finance',
          'staff', 'attendance', 'shifts', 'customers', 'reservations', 'reviews',
          'feedback', 'coupons', 'campaigns', 'loyalty', 'offers', 'reports',
          'analytics', 'branches', 'settings', 'website', 'notifications',
          'ai', 'delivery', 'crm', 'cms', 'omnichannel',
        ]),
      },
      {
        name: 'Branch Manager',
        description: 'Manages daily branch operations, staff, and reporting',
        permissionIds: [
          ...allCrud(['dashboard', 'orders', 'tables', 'menu', 'categories', 'staff', 'shifts', 'reviews', 'feedback']),
          ...allReadWrite(['pos', 'kitchen', 'payments', 'invoices', 'reports', 'analytics', 'customers', 'reservations', 'delivery', 'crm', 'notifications']),
          ...allRead(['inventory', 'suppliers', 'purchases', 'finance', 'attendance', 'reports', 'branches']),
          ...allOf('settings', ['read', 'update']),
          has('website', 'read'),
          has('branches', 'read'),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Cashier',
        description: 'Handles POS operations, payments, invoices, order processing',
        permissionIds: [
          ...allCrud(['pos', 'payments']),
          ...allReadWrite(['orders', 'tables', 'invoices', 'customers']),
          ...allRead(['menu', 'dashboard', 'kitchen']),
          has('orders', 'create'),
          has('orders', 'read'),
          has('orders', 'update'),
          has('tables', 'read'),
          has('tables', 'update'),
          has('menu', 'read'),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Waiter',
        description: 'Takes orders at tables, serves customers',
        permissionIds: [
          ...allCrud(['orders']),
          ...allReadWrite(['tables', 'menu', 'customers']),
          ...allRead(['dashboard', 'kitchen', 'categories']),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Chef',
        description: 'Manages kitchen display, preparation workflow, and menu',
        permissionIds: [
          ...allCrud(['kitchen']),
          ...allReadWrite(['menu', 'orders', 'inventory']),
          ...allRead(['dashboard', 'categories', 'reports']),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Kitchen Staff',
        description: 'Views kitchen tickets, updates order item status',
        permissionIds: [
          ...allReadWrite(['kitchen']),
          ...allRead(['orders', 'menu', 'categories', 'dashboard']),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Inventory Manager',
        description: 'Manages inventory, suppliers, purchase orders',
        permissionIds: [
          ...allCrud(['inventory', 'suppliers', 'purchases']),
          ...allReadWrite(['menu', 'categories', 'reports']),
          ...allRead(['dashboard', 'kitchen', 'orders']),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Accountant',
        description: 'Manages finance, invoices, transactions',
        permissionIds: [
          ...allCrud(['finance', 'invoices', 'transactions']),
          ...allReadWrite(['payments', 'reports', 'analytics']),
          ...allRead(['dashboard', 'orders', 'customers', 'menu']),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Delivery Staff',
        description: 'Manages delivery pickups, drop-offs',
        permissionIds: [
          ...allCrud(['delivery']),
          ...allReadWrite(['orders']),
          ...allRead(['dashboard', 'menu', 'tables']),
        ].filter(Boolean) as string[],
      },
      {
        name: 'Receptionist',
        description: 'Manages reservations, walk-in customers',
        permissionIds: [
          ...allCrud(['reservations', 'customers']),
          ...allReadWrite(['tables', 'menu']),
          ...allRead(['dashboard', 'categories', 'reviews', 'website']),
        ].filter(Boolean) as string[],
      },
    ];
  }
}
