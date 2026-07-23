import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { BillingService } from '../billing/billing.service';
import { OwnerProfileService } from '../owner-profile/owner-profile.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { generateSecret, generateURI, generateSync, verifySync } from 'otplib';

const IMPERSONATION_SECRET = (() => {
  const secret = process.env.IMPERSONATION_JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('IMPERSONATION_JWT_SECRET must be set in production');
  }
  return secret || 'impersonation-secret-change-in-production';
})();

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private eventBus: EventBusService,
    private billingService: BillingService,
    private ownerProfileService: OwnerProfileService,
  ) {}

  async login(email: string, password: string, ip?: string, ua?: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    if (!admin.isActive) throw new UnauthorizedException('Account disabled');

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.adminSession.create({
      data: {
        adminUserId: admin.id,
        token,
        ipAddress: ip,
        userAgent: ua,
        expiresAt,
      },
    });

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Admin login: ${admin.email} from ${ip}`);
    return { token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } };
  }

  async verifyMfa(adminId: string, code: string, token: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin || !admin.mfaSecret) throw new UnauthorizedException('Invalid');

    const isValid = verifySync({ token: code, secret: admin.mfaSecret });
    if (!isValid) throw new UnauthorizedException('Invalid MFA code');

    await this.prisma.adminSession.update({
      where: { token },
      data: { mfaVerified: true },
    });

    return { verified: true };
  }

  async enableMfa(adminId: string) {
    const secret = generateSecret();
    const otpauth = generateURI({ secret, issuer: 'NexaROS Admin', label: adminId });
    return { secret, otpauth };
  }

  async saveMfaSecret(adminId: string, secret: string) {
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { mfaSecret: secret, mfaEnabled: true },
    });
  }

  async getSessions(adminId: string) {
    return this.prisma.adminSession.findMany({
      where: { adminUserId: adminId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(token: string) {
    await this.prisma.adminSession.deleteMany({ where: { token } });
    return { revoked: true };
  }

  async getAuditLogs(page = 1, limit = 50, search?: string, severity?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { adminUser: { name: { contains: search, mode: 'insensitive' } } },
        { adminUser: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (severity) where.severity = severity as any;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: { adminUser: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);
    return { logs, total, page, pages: Math.ceil(total / limit) };
  }

  async getNotifications(limit = 50, unreadOnly = false) {
    const where: any = {};
    if (unreadOnly) where.readAt = null;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        where,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          newData: true,
          ipAddress: true,
          createdAt: true,
          readAt: true,
          adminUser: { select: { name: true, email: true } },
        },
      }),
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.count({ where: { readAt: null } }),
    ]);

    return { notifications, total, unreadCount };
  }

  async getUnreadNotificationCount() {
    const count = await this.prisma.adminAuditLog.count({ where: { readAt: null } });
    return { unreadCount: count };
  }

  async markNotificationRead(id: string) {
    await this.prisma.adminAuditLog.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return { read: true };
  }

  async markAllNotificationsRead() {
    await this.prisma.adminAuditLog.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
    return { read: true };
  }

  async getDatabaseStats() {
    const tableNames = [
      'tenants', 'branches', 'users', 'roles', 'permissions', 'staff',
      'categories', 'menu_items', 'restaurant_tables', 'orders', 'order_items',
      'order_status_history', 'payments', 'invoices', 'inventory_items',
      'stock_movements', 'suppliers', 'purchases', 'purchase_items',
      'reservations', 'shifts', 'staff_shifts', 'attendance',
      'audit_logs', 'platform_plans', 'plan_entitlements', 'subscriptions',
      'feature_flags', 'tenant_feature_flags', 'coupons', 'coupon_usage',
      'payment_promises', 'subscription_payments', 'subscription_invoices',
      'admin_users', 'admin_sessions', 'admin_audit_logs', 'demo_requests',
      'support_tickets', 'ticket_messages', 'platform_settings',
      'tenant_settings', 'tax_settings', 'membership_tiers', 'loyalty_points',
      'wallets', 'reviews', 'feedbacks', 'customers', 'customer_addresses',
      'dead_letter_logs', 'campaigns', 'email_templates', 'audience_segments',
    ];

    const counts = await Promise.all(
      tableNames.map(async (table) => {
        try {
          const result = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${table}"`);
          return { name: table, rows: (result as any)[0]?.count || 0 };
        } catch {
          return { name: table, rows: 0 };
        }
      }),
    );

    const totalRows = counts.reduce((sum, t) => sum + t.rows, 0);
    const totalTables = tableNames.length;

    let dbSize = '0 MB';
    try {
      const sizeResult = await this.prisma.$queryRawUnsafe(
        `SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
      );
      dbSize = (sizeResult as any)[0]?.size || '0 MB';
    } catch {}

    let activeConnections = 0;
    try {
      const connResult = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM pg_stat_activity WHERE state = 'active'`,
      );
      activeConnections = (connResult as any)[0]?.count || 0;
    } catch {}

    return {
      tables: counts.sort((a, b) => b.rows - a.rows),
      totalTables,
      totalRows,
      dbSize,
      activeConnections,
    };
  }

  async logAction(adminUserId: string, action: string, entity: string, entityId?: string, oldData?: any, newData?: any, ip?: string) {
    return this.prisma.adminAuditLog.create({
      data: { adminUserId, action, entity, entityId, oldData, newData, ipAddress: ip },
    });
  }

  // ─── Impersonation ───

  async impersonate(adminUserId: string, tenantId: string, targetUserId: string, ip?: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || !admin.isActive) throw new UnauthorizedException('Admin account not found or disabled');

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, tenantId },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true, tenantId: true },
    });
    if (!targetUser) throw new NotFoundException('Target user not found in this restaurant');
    if (!targetUser.isActive) throw new BadRequestException('Target user account is inactive');

    const token = jwt.sign(
      {
        sub: targetUser.id,
        tenantId: targetUser.tenantId,
        impersonatorId: adminUserId,
        isImpersonation: true,
      },
      IMPERSONATION_SECRET,
      { expiresIn: '30m' },
    );

    await this.logAction(
      adminUserId,
      'IMPERSONATE',
      'User',
      targetUserId,
      null,
      { tenantId, targetEmail: targetUser.email, targetName: `${targetUser.firstName} ${targetUser.lastName}` },
      ip,
    );

    this.logger.log(
      `Admin ${admin.email} impersonating user ${targetUser.email} in tenant ${tenantId}`,
    );

    return {
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: `${targetUser.firstName} ${targetUser.lastName}`.trim(),
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async exitImpersonation(adminUserId: string, ip?: string) {
    await this.logAction(adminUserId, 'EXIT_IMPERSONATION', 'Session', undefined, undefined, undefined, ip);
    return { success: true };
  }

  async listAdminUsers(search = '', page = 1, limit = 50) {
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      this.prisma.adminUser.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true, name: true, email: true, role: true,
          isActive: true, mfaEnabled: true, lastLoginAt: true, createdAt: true,
        },
      }),
      this.prisma.adminUser.count({ where }),
    ]);
    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async createAdminUser(adminUserId: string, data: { name: string; email: string; password: string; role?: string }, ip?: string) {
    const existing = await this.prisma.adminUser.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('An admin with this email already exists');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.adminUser.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: (data.role as any) || 'ADMIN',
        isActive: true,
      },
    });
    await this.logAction(adminUserId, 'ADMIN_USER_CREATED', 'AdminUser', user.id, undefined, undefined, ip);
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  // ═══════════════════════════════════════════════════════════════
  // PROVISIONING — Single atomic transaction for restaurant creation
  // ═══════════════════════════════════════════════════════════════

  async provisionTenant(
    adminUserId: string,
    data: {
      restaurantName: string;
      ownerName: string;
      ownerEmail: string;
      ownerPhone?: string;
      password?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      cuisineType?: string;
      planId?: string;
      gstNumber?: string;
      phone?: string;
      timezone?: string;
      currency?: string;
      subdomain?: string;
      logo?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    },
    ip?: string,
  ) {
    // ── Step 0: Input validation ──
    if (!data.restaurantName?.trim()) throw new BadRequestException('Restaurant name is required');
    if (!data.ownerName?.trim()) throw new BadRequestException('Owner name is required');
    if (!data.ownerEmail?.trim()) throw new BadRequestException('Owner email is required');

    // Find or create OwnerProfile for multi-tenant support
    let ownerProfile = await this.prisma.ownerProfile.findFirst({
      where: { email: data.ownerEmail.trim().toLowerCase(), deletedAt: null },
    });
    const isNewOwner = !ownerProfile;
    
    if (!ownerProfile) {
      ownerProfile = await this.ownerProfileService.create({
        email: data.ownerEmail.trim(),
        name: data.ownerName.trim(),
        phone: data.ownerPhone?.trim(),
        password: data.password,
      }).then(r => r.owner);
    }

    const slug = data.restaurantName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingTenant = await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
    if (existingTenant) throw new BadRequestException('A restaurant with a similar name already exists');

    // Validate subdomain if provided, otherwise auto-generate
    let subdomain = data.subdomain?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || slug;
    subdomain = subdomain.replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    if (!subdomain) subdomain = slug;

    const existingSubdomain = await this.prisma.tenant.findFirst({ where: { subdomain, deletedAt: null } });
    if (existingSubdomain) throw new BadRequestException(`Subdomain "${subdomain}" is already taken`);

    const plainPassword = data.password || this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const timezone = data.timezone?.trim() || 'Asia/Kolkata';
    const currency = data.currency?.trim() || 'INR';
    const country = data.country?.trim() || 'India';

    // ── Step 0b: Load plan + entitlements ──
    const plan = data.planId
      ? await this.prisma.platformPlan.findUnique({ where: { id: data.planId } })
      : await this.prisma.platformPlan.findFirst({ where: { slug: 'starter-free', isActive: true } });

    if (!plan) throw new BadRequestException('Please select a valid plan');

    // ── Step 0c: Payment verification for paid plans ──
    if (Number(plan.price) > 0) {
      if (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature) {
        throw new BadRequestException('Payment verification is required for paid plans');
      }

      try {
        await this.billingService.verifyPaymentOnly(
          data.razorpayOrderId,
          data.razorpayPaymentId,
          data.razorpaySignature,
        );
      } catch (err: any) {
        throw new BadRequestException(`Payment verification failed: ${err.message}`);
      }
    }

    const entitlements = plan
      ? Object.fromEntries(
          (await this.prisma.planEntitlement.findMany({ where: { planId: plan.id } })).map(
            (e) => [e.moduleKey, e.enabled],
          ),
        )
      : {};

    const allFeatureFlags = await this.prisma.featureFlag.findMany();

    const trialDays = plan?.trialDays || 14;
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    // ═══════════════════════════════════════════════════════════
    // ATOMIC TRANSACTION — if any step fails, everything rolls back
    // ═══════════════════════════════════════════════════════════
    const result = await this.prisma.$transaction(async (tx) => {

      // ── 1. Create Tenant (restaurant) with OwnerProfile ──
      const tenant = await tx.tenant.create({
        data: {
          ownerProfileId: ownerProfile!.id,
          name: data.restaurantName.trim(),
          slug,
          subdomain,
          phone: data.phone || data.ownerPhone || null,
          email: data.ownerEmail.trim(),
          address: data.address?.trim() || null,
          gstNumber: data.gstNumber?.trim() || null,
          city: data.city?.trim() || null,
          state: data.state?.trim() || null,
          country,
          timezone,
          currency,
          businessType: data.cuisineType?.trim() || null,
          logo: data.logo || null,
          isActive: true,
          status: 'ACTIVE',
          onboardingStatus: 'IN_PROGRESS',
          createdBy: adminUserId,
        },
      });

      // ── 2. Create Branch (Main Branch) ──
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch',
          displayName: data.restaurantName?.trim() || 'Main Branch',
          address: data.address?.trim() || null,
          city: data.city?.trim() || null,
          state: data.state?.trim() || null,
          country,
          phone: data.phone || data.ownerPhone || null,
          branchType: 'PRIMARY',
          isPrimary: true,
          isActive: true,
          status: 'ACTIVE',
        },
      });

      // ── 3. Upsert ALL default Permissions (ALL modules × 4 actions) ──
      const permissions = await Promise.all(
        this.getDefaultPermissions().map((p) =>
          tx.permission.upsert({
            where: { module_action: { module: p.module, action: p.action } },
            update: {},
            create: p,
          }),
        ),
      );

      // ── 4. Create Owner Role with all permissions ──
      const ownerRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Owner',
          description: 'Full access to all features',
          isSystem: true,
          permissions: {
            create: permissions.map((p) => ({
              permissionId: p.id,
            })),
          },
        },
      });

      // ── 5. Create Owner User ──
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.ownerEmail.trim(),
          phone: data.ownerPhone?.trim() || null,
          password: hashedPassword,
          firstName: data.ownerName.trim(),
          lastName: '',
          role: 'OWNER',
          isActive: true,
        },
      });

      // ── 6. Create Staff record (links User → Role → Branch) ──
      //    Critical: JwtAuthGuard loads permissions via Staff → Role → RolePermission
      const staff = await tx.staff.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          userId: owner.id,
          roleId: ownerRole.id,
          name: data.ownerName.trim(),
          phone: data.ownerPhone?.trim() || null,
          status: 'ACTIVE',
          isActive: true,
        },
      });

      // ── 4b. Create additional Default Roles with tailored permissions ──
      const roleDefs = this.getDefaultRoleDefinitions(permissions);
      for (const roleDef of roleDefs) {
        if (roleDef.name === 'Owner') continue; // already created
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

      const defaultRoleNames = roleDefs.map(r => r.name).filter(n => n !== 'Owner');

      // ── 7. Create Subscription (Trial) ──
      let subscription = null;
      if (plan) {
        subscription = await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            status: 'TRIAL',
            entitlements,
            trialStartedAt: now,
            trialEndsAt,
            currentPeriodStart: now,
            currentPeriodEnd: trialEndsAt,
            nextBillingDate: trialEndsAt,
            gracePeriodDays: 7,
          },
        });
      }

      // ── 8. Create Website Configuration (default template) ──
      const websiteConfig = await tx.tenantWebsiteConfig.create({
        data: {
          tenantId: tenant.id,
          restaurantName: data.restaurantName.trim(),
          phone: data.phone || data.ownerPhone || null,
          email: data.ownerEmail.trim(),
          address: data.address?.trim() || null,
          primaryColor: '#E51A24',
          secondaryColor: '#111111',
          accentColor: '#F1B31C',
          currency,
          timezone,
          features: { qrOrdering: true, onlineOrdering: true, reservations: true, gallery: true, reviews: true },
          seo: {
            title: `${data.restaurantName.trim()} | Best Restaurant in ${data.city || 'Town'}`,
            description: `Welcome to ${data.restaurantName.trim()} — experience the finest dining. Order online, reserve a table, or explore our menu crafted with passion.`,
            keywords: [
              data.restaurantName.trim(), 'restaurant', 'fine dining',
              (data.city || 'restaurant'), 'food delivery', 'order online',
              data.cuisineType?.trim() || 'multi-cuisine', 'best restaurant',
            ].filter(Boolean),
            ogImage: '',
            ogType: 'restaurant',
            // Schema.org structured data for rich search results (embedded in seo)
            structuredData: {
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: data.restaurantName.trim(),
              description: `Welcome to ${data.restaurantName.trim()} — experience the finest ${data.cuisineType?.trim() || 'dining'} in ${data.city || 'our location'}.`,
              image: '',
              url: `https://${subdomain}.nexaros.in`,
              telephone: data.phone || data.ownerPhone || '',
              email: data.ownerEmail.trim(),
              address: {
                '@type': 'PostalAddress',
                streetAddress: data.address?.trim() || '',
                addressLocality: data.city?.trim() || '',
                addressRegion: data.state?.trim() || '',
                addressCountry: country,
              },
              servesCuisine: data.cuisineType?.trim() || 'Multi-Cuisine',
              currencyAccepted: currency,
              priceRange: '₹₹',
              acceptsReservations: 'Yes',
            },
          },
          homeSections: [
            {
              type: 'hero',
              title: `Welcome to ${data.restaurantName.trim()}`,
              subtitle: 'Serving authentic flavours with passion',
              ctaText: 'View Menu',
              ctaLink: '#menu',
              backgroundImage: '',
            },
            {
              type: 'about',
              title: 'Our Story',
              content: `At ${data.restaurantName.trim()}, we believe in serving fresh, delicious meals made with love. Our chefs craft each dish using the finest ingredients and traditional recipes passed down through generations.`,
              image: '',
            },
            {
              type: 'menu',
              title: 'Our Menu',
              displayMode: 'categories',
              showPrices: true,
              showImages: true,
            },
            {
              type: 'gallery',
              title: 'Gallery',
              subtitle: 'A glimpse into our world of flavours',
              images: [],
            },
            {
              type: 'reservation',
              title: 'Book a Table',
              subtitle: 'Reserve your spot for an unforgettable dining experience',
            },
            {
              type: 'reviews',
              title: 'What Our Customers Say',
              displayMode: 'carousel',
            },
            {
              type: 'contact',
              title: 'Get in Touch',
              subtitle: `Visit us at ${data.address || 'our restaurant'} or give us a call`,
              phone: data.phone || data.ownerPhone || '',
              email: data.ownerEmail.trim(),
              address: data.address?.trim() || '',
            },
          ],
          socialLinks: {
            facebook: '',
            instagram: '',
            twitter: '',
            whatsapp: data.phone || data.ownerPhone || '',
            googleMaps: '',
          },
          legalPages: {
            privacyPolicy: {
              title: 'Privacy Policy',
              content: `This Privacy Policy describes how ${data.restaurantName.trim()} collects, uses, and shares your personal information.`,
              lastUpdated: new Date().toISOString(),
            },
            termsOfService: {
              title: 'Terms of Service',
              content: `By using ${data.restaurantName.trim()} services, you agree to these terms. Please read them carefully.`,
              lastUpdated: new Date().toISOString(),
            },
            refundPolicy: {
              title: 'Refund & Cancellation Policy',
              content: 'Our refund and cancellation policy outlines the terms under which orders can be cancelled and refunds processed.',
              lastUpdated: new Date().toISOString(),
            },
            shippingPolicy: {
              title: 'Delivery & Shipping Policy',
              content: 'Our delivery partners ensure timely and safe delivery of your orders. Delivery times may vary based on location and order volume.',
              lastUpdated: new Date().toISOString(),
            },
          },
          analytics: {
            googleAnalyticsId: '',
            facebookPixelId: '',
            hotjarId: '',
          },
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

      // ── 9. Create default Menu Categories ──
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

      // ── 10. Create default Restaurant Tables (T1-T10) with QR codes ──
      const qrBaseUrl = `https://${subdomain}.nexaros.in/order`;
      const defaultTables = Array.from({ length: 10 }, (_, i) => ({
        branchId: branch.id,
        number: i + 1,
        name: `T${i + 1}`,
        capacity: i < 2 ? 8 : 4,
        status: 'FREE' as const,
        isActive: true,
        // QR code URL — actual image generation happens as a background job
        qrCode: `${qrBaseUrl}/${branch.id}/${i + 1}`,
      }));

      await tx.restaurantTable.createMany({ data: defaultTables });

      // ── 11. Seed default Shifts per branch ──
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
          createdBy: adminUserId,
        })),
      });

      // ── 12. Seed default Membership Tiers ──
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
          createdBy: adminUserId,
        })),
      });

      // ── 13. Seed default Tax Settings (Indian GST) ──
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

      // ── 14. Seed default Tenant Feature Flags from plan entitlements ──
      if (allFeatureFlags.length > 0) {
        await tx.tenantFeatureFlag.createMany({
          data: allFeatureFlags.map((ff) => ({
            tenantId: tenant.id,
            featureFlagId: ff.id,
            enabled: ff.enabled && entitlements[ff.key] !== false,
          })),
        });
      }

      // ── 15. Create default Tenant Settings (key-value config) ──
      const defaultSettings = [
        { key: 'business.name', value: data.restaurantName.trim(), category: 'general' },
        { key: 'business.phone', value: data.phone || data.ownerPhone || '', category: 'general' },
        { key: 'business.email', value: data.ownerEmail.trim(), category: 'general' },
        { key: 'business.timezone', value: timezone, category: 'general' },
        { key: 'business.currency', value: currency, category: 'general' },
        { key: 'business.country', value: country, category: 'general' },
        { key: 'pos.receipt_footer', value: `Thank you for dining at ${data.restaurantName.trim()}!`, category: 'pos' },
        { key: 'orders.auto_accept', value: false, category: 'orders' },
        { key: 'orders.prep_time_minutes', value: 15, category: 'orders' },
        { key: 'inventory.low_stock_threshold', value: 10, category: 'inventory' },
        { key: 'website.enabled', value: true, category: 'website' },
        { key: 'notifications.email_enabled', value: true, category: 'notifications' },
        { key: 'notifications.sms_enabled', value: false, category: 'notifications' },
        { key: 'notifications.push_enabled', value: false, category: 'notifications' },
        // Payment defaults
        { key: 'payments.default_method', value: 'CASH', category: 'payments' },
        { key: 'payments.enable_online', value: true, category: 'payments' },
        { key: 'payments.gateway', value: 'razorpay', category: 'payments' },
        { key: 'payments.qr_enabled', value: true, category: 'payments' },
        // Invoice defaults
        { key: 'invoices.prefix', value: 'INV', category: 'invoices' },
        { key: 'invoices.auto_generate', value: true, category: 'invoices' },
        { key: 'invoices.gst_enabled', value: true, category: 'invoices' },
        { key: 'invoices.digit_count', value: 6, category: 'invoices' },
        // Dashboard defaults
        { key: 'dashboard.default_view', value: 'daily', category: 'dashboard' },
        { key: 'dashboard.refresh_interval', value: 30, category: 'dashboard' },
        { key: 'dashboard.show_low_stock', value: true, category: 'dashboard' },
        { key: 'dashboard.show_recent_orders', value: true, category: 'dashboard' },
        // Report defaults
        { key: 'reports.default_period', value: 'today', category: 'reports' },
        { key: 'reports.date_format', value: 'DD/MM/YYYY', category: 'reports' },
        { key: 'reports.auto_generate_daily', value: true, category: 'reports' },
        { key: 'reports.export_format', value: 'PDF', category: 'reports' },
        // Notification templates
        { key: 'notifications.welcome_subject', value: `Welcome to ${data.restaurantName.trim()}!`, category: 'notifications' },
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

      // ── 16. Create initial AuditLog entry ──
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
            plan: plan?.name || 'None',
            provisionedBy: adminUserId,
          },
          ipAddress: ip || null,
        },
      });

      return {
        tenant,
        branch,
        ownerRole,
        owner,
        staff,
        subscription,
        plan,
        websiteConfig,
        featureFlagCount: allFeatureFlags.length,
        settingsCount: defaultSettings.length,
        taxSettingsCount: defaultTaxSettings.length,
        membershipTierCount: defaultTiers.length,
        shiftCount: defaultShifts.length,
        roleCount: defaultRoleNames.length,
      };
    });

    // ═══════════════════════════════════════════════════════════
    // POST-TRANSACTION: Audit log, events, notifications
    // (These are outside the transaction — data is still created even if these fail)
    // ═══════════════════════════════════════════════════════════

    // Admin audit log
    await this.logAction(
      adminUserId,
      'PROVISION',
      'Tenant',
      result.tenant.id,
      null,
      {
        restaurantName: data.restaurantName,
        ownerEmail: data.ownerEmail,
        subdomain: result.tenant.subdomain,
        plan: result.plan?.name,
        branchId: result.branch.id,
        staffId: result.staff.id,
        websiteConfigId: result.websiteConfig.id,
        featureFlags: result.featureFlagCount,
        settings: result.settingsCount,
        taxSettings: result.taxSettingsCount,
        membershipTiers: result.membershipTierCount,
        shifts: result.shiftCount,
      },
      ip,
    );

    this.logger.log(
      `Provisioned restaurant: ${result.tenant.name} (${result.tenant.slug}) ` +
      `| subdomain: ${result.tenant.subdomain} ` +
      `| branch: ${result.branch.id} | owner: ${result.owner.id} | staff: ${result.staff.id} ` +
      `| role: ${result.ownerRole.id} | website: ${result.websiteConfig.id} ` +
      `| featureFlags: ${result.featureFlagCount} | settings: ${result.settingsCount} ` +
      `| taxSettings: ${result.taxSettingsCount} | tiers: ${result.membershipTierCount} ` +
      `| shifts: ${result.shiftCount} | by admin ${adminUserId}`,
    );

    // Real-time event
    this.eventBus.emitToTenant(result.tenant.id, 'tenant.created', {
      tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug, subdomain: result.tenant.subdomain },
      branch: { id: result.branch.id, name: result.branch.name },
      owner: { id: result.owner.id, name: data.ownerName, email: data.ownerEmail },
      subscription: result.subscription ? { plan: result.plan?.name, status: 'TRIAL', trialEndsAt } : null,
    });

    // Return comprehensive response
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
        name: data.ownerName.trim(),
        email: data.ownerEmail.trim(),
        phone: data.ownerPhone || null,
        password: plainPassword,
      },
      subscription: result.subscription
        ? {
            id: result.subscription.id,
            plan: result.plan?.name,
            status: 'TRIAL',
            trialEndsAt,
          }
        : null,
      provisioning: {
        permissions: this.getDefaultPermissions().length,
        featureFlags: result.featureFlagCount,
        settings: result.settingsCount,
        taxSettings: result.taxSettingsCount,
        membershipTiers: result.membershipTierCount,
        shifts: result.shiftCount,
        roles: result.roleCount,
        categories: 8,
        tables: 10,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PERMISSIONS — Complete module coverage for the restaurant system
  // ═══════════════════════════════════════════════════════════════

  private getDefaultPermissions() {
    const modules = [
      // Core POS & Orders
      'dashboard',
      'orders',
      'pos',
      'kitchen',
      'tables',
      // Menu Management
      'menu',
      'categories',
      // Inventory & Supply Chain
      'inventory',
      'suppliers',
      'purchases',
      // Finance & Payments
      'payments',
      'invoices',
      'finance',
      // Staff Management
      'staff',
      'attendance',
      'shifts',
      // Customer Management
      'customers',
      'reservations',
      'reviews',
      'feedback',
      // Marketing
      'coupons',
      'campaigns',
      'loyalty',
      'offers',
      // Reporting & Analytics
      'reports',
      'analytics',
      // Branch Management
      'branches',
      // System Settings
      'settings',
      'website',
      'notifications',
      // AI & Automation
      'ai',
      // Delivery
      'delivery',
      // CRM
      'crm',
      // Content Management
      'cms',
      // Omnichannel
      'omnichannel',
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

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT ROLE DEFINITIONS — Granular permission sets for each role
  // ═══════════════════════════════════════════════════════════════

  private getDefaultRoleDefinitions(allPermissions: Array<{ id: string; module: string; action: string }>) {
    // Build lookup: module:action → permissionId
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
      // Owner — already handled, included for completeness
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
      // Branch Manager — daily operations, staff scheduling, reports
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
      // Cashier — POS, payments, invoices
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
      // Waiter — takes orders, serves customers
      {
        name: 'Waiter',
        description: 'Takes orders at tables, serves customers, processes dine-in requests',
        permissionIds: [
          ...allCrud(['orders']),
          ...allReadWrite(['tables', 'menu', 'customers']),
          ...allRead(['dashboard', 'kitchen', 'categories']),
        ].filter(Boolean) as string[],
      },
      // Chef — manages kitchen operations
      {
        name: 'Chef',
        description: 'Manages kitchen display, preparation workflow, and menu',
        permissionIds: [
          ...allCrud(['kitchen']),
          ...allReadWrite(['menu', 'orders', 'inventory']),
          ...allRead(['dashboard', 'categories', 'reports']),
        ].filter(Boolean) as string[],
      },
      // Kitchen Staff — preparation and plating
      {
        name: 'Kitchen Staff',
        description: 'Views kitchen tickets, updates order item status',
        permissionIds: [
          ...allReadWrite(['kitchen']),
          ...allRead(['orders', 'menu', 'categories', 'dashboard']),
        ].filter(Boolean) as string[],
      },
      // Inventory Manager — supply chain
      {
        name: 'Inventory Manager',
        description: 'Manages inventory, suppliers, purchase orders, and stock movements',
        permissionIds: [
          ...allCrud(['inventory', 'suppliers', 'purchases']),
          ...allReadWrite(['menu', 'categories', 'reports']),
          ...allRead(['dashboard', 'kitchen', 'orders']),
        ].filter(Boolean) as string[],
      },
      // Accountant — finance
      {
        name: 'Accountant',
        description: 'Manages finance, invoices, transactions, and financial reporting',
        permissionIds: [
          ...allCrud(['finance', 'invoices', 'transactions']),
          ...allReadWrite(['payments', 'reports', 'analytics']),
          ...allRead(['dashboard', 'orders', 'customers', 'menu']),
        ].filter(Boolean) as string[],
      },
      // Delivery Staff
      {
        name: 'Delivery Staff',
        description: 'Manages delivery pickups, drop-offs, and order tracking',
        permissionIds: [
          ...allCrud(['delivery']),
          ...allReadWrite(['orders']),
          ...allRead(['dashboard', 'menu', 'tables']),
        ].filter(Boolean) as string[],
      },
      // Receptionist — front desk
      {
        name: 'Receptionist',
        description: 'Manages reservations, walk-in customers, table allocation, and inquiries',
        permissionIds: [
          ...allCrud(['reservations', 'customers']),
          ...allReadWrite(['tables', 'menu']),
          ...allRead(['dashboard', 'categories', 'reviews', 'website']),
        ].filter(Boolean) as string[],
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Map an incoming role name (often an enum-like value from the admin portal,
   * e.g. SERVER, MANAGER, ADMIN, KITCHEN, CASHIER) to the canonical per-tenant
   * role name used by the platform. Falls back to the original input so a
   * brand-new role can still be created on-the-fly.
   */
  private mapRoleName(input: string): string {
    const key = (input || '').trim().toLowerCase();
    const synonyms: Record<string, string> = {
      server: 'Waiter',
      waiter: 'Waiter',
      manager: 'Branch Manager',
      'branch manager': 'Branch Manager',
      admin: 'Branch Manager',
      kitchen: 'Kitchen Staff',
      'kitchen staff': 'Kitchen Staff',
      chef: 'Chef',
      cashier: 'Cashier',
      inventory: 'Inventory Manager',
      'inventory manager': 'Inventory Manager',
      accountant: 'Accountant',
      delivery: 'Delivery Staff',
      'delivery staff': 'Delivery Staff',
      receptionist: 'Receptionist',
      owner: 'Owner',
      staff: 'Waiter',
    };
    return synonyms[key] || (input || 'Waiter').trim();
  }

  /**
   * Create a tenant-scoped role on-the-fly when one does not already exist.
   * Permissions are derived from the default role definitions so the new
   * staff member gets a sensible, scoped permission set.
   */
  private async createTenantRole(tenantId: string, roleName: string) {
    const permissions = await this.prisma.permission.findMany();
    const defs = this.getDefaultRoleDefinitions(permissions);
    const def = defs.find((d) => d.name.toLowerCase() === roleName.toLowerCase())
      || defs.find((d) => d.name === 'Waiter');
    const permissionIds = [...new Set(def?.permissionIds || [])].filter(Boolean) as string[];

    return this.prisma.role.create({
      data: {
        tenantId,
        name: roleName,
        description: `Auto-created ${roleName} role`,
        isSystem: false,
        permissions: {
          create: permissionIds.map((pid) => ({ permissionId: pid })),
        },
      },
    });
  }

  async listAllStaff(page = 1, limit = 20, search = '', role = '') {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (role) {
      where.role = { name: role };
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          isActive: true,
          createdAt: true,
          user: { select: { id: true, email: true, lastLoginAt: true } },
          role: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true, tenant: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.staff.count({ where }),
    ]);

    const data = staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.user?.email || '',
      phone: s.phone,
      role: s.role?.name || '',
      branchId: s.branch?.id,
      branchName: s.branch?.name,
      tenantId: s.branch?.tenant?.id || '',
      tenantName: s.branch?.tenant?.name,
      status: s.isActive ? 'active' : 'inactive',
      lastLogin: s.user?.lastLoginAt,
      createdAt: s.createdAt,
    }));

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async createStaff(body: { name: string; email: string; phone?: string; role: string; tenantId: string; branchId?: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: body.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let branchId = body.branchId;
    if (!branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { tenantId: body.tenantId, isActive: true },
      });
      branchId = branch?.id;
    }
    if (!branchId) throw new BadRequestException('No active branch found for tenant');

    // Resolve the requested role to a per-tenant role. Roles are tenant-scoped,
    // so we map incoming names (SERVER, MANAGER, ADMIN, KITCHEN, CASHIER, …)
    // to the canonical tenant role names created at provisioning. If the role
    // does not yet exist for this tenant, it is created on-the-fly.
    const roleName = this.mapRoleName(body.role);
    let role = await this.prisma.role.findFirst({
      where: { tenantId: body.tenantId, name: roleName },
    });
    if (!role) {
      role = await this.createTenantRole(body.tenantId, roleName);
    }

    // Map the staff role name to a valid UserRole enum value
    const userRole: 'OWNER' | 'MANAGER' | 'STAFF' =
      roleName.toLowerCase() === 'owner'
        ? 'OWNER'
        : roleName.toLowerCase() === 'manager' || roleName.toLowerCase() === 'branch manager'
          ? 'MANAGER'
          : 'STAFF';

    const tempPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        firstName: body.name.split(' ')[0] || body.name,
        lastName: body.name.split(' ').slice(1).join(' ') || '',
        tenantId: body.tenantId,
        password: hashedPassword,
        role: userRole,
      },
    });

    const staff = await this.prisma.staff.create({
      data: {
        name: body.name,
        phone: body.phone,
        tenantId: body.tenantId,
        branchId,
        userId: user.id,
        roleId: role.id,
      },
      include: {
        role: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return staff;
  }

  async listAllBranches(page: number, limit: number, search: string, tenantId: string, status: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true } },
          _count: { select: { staff: true, orders: true, tables: true } },
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true, role: { select: { name: true } } }, take: 10 },
        _count: { select: { staff: true, orders: true, tables: true } },
      },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async updateBranchStatus(id: string, status: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');

    return this.prisma.branch.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
