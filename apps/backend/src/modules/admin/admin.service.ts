import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { generateSecret, generateURI, generateSync, verifySync } from 'otplib';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.adminAuditLog.count(),
    ]);
    return { logs, total, page, pages: Math.ceil(total / limit) };
  }

  async logAction(adminUserId: string, action: string, entity: string, entityId?: string, oldData?: any, newData?: any, ip?: string) {
    return this.prisma.adminAuditLog.create({
      data: { adminUserId, action, entity, entityId, oldData, newData, ipAddress: ip },
    });
  }

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
      cuisineType?: string;
      planId?: string;
      gstNumber?: string;
      phone?: string;
    },
    ip?: string,
  ) {
    if (!data.restaurantName?.trim()) throw new BadRequestException('Restaurant name is required');
    if (!data.ownerName?.trim()) throw new BadRequestException('Owner name is required');
    if (!data.ownerEmail?.trim()) throw new BadRequestException('Owner email is required');

    const existingUser = await this.prisma.user.findUnique({ where: { email: data.ownerEmail.trim() } });
    if (existingUser) throw new BadRequestException('An account with this email already exists');

    const slug = data.restaurantName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingTenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) throw new BadRequestException('A restaurant with a similar name already exists');

    const plainPassword = data.password || this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const plan = data.planId
      ? await this.prisma.platformPlan.findUnique({ where: { id: data.planId } })
      : await this.prisma.platformPlan.findFirst({ where: { slug: 'starter-free', isActive: true } });

    const entitlements = plan
      ? Object.fromEntries(
          (await this.prisma.planEntitlement.findMany({ where: { planId: plan.id } })).map(
            (e) => [e.moduleKey, e.enabled],
          ),
        )
      : {};

    const trialDays = plan?.trialDays || 14;
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.restaurantName.trim(),
          slug,
          phone: data.phone || data.ownerPhone || null,
          email: data.ownerEmail.trim(),
          address: data.address?.trim() || null,
          gstNumber: data.gstNumber?.trim() || null,
          city: data.city?.trim() || null,
          state: data.state?.trim() || null,
          businessType: data.cuisineType?.trim() || null,
          isActive: true,
        },
      });

      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch',
          address: data.address?.trim() || null,
          phone: data.phone || data.ownerPhone || null,
          isPrimary: true,
          isActive: true,
        },
      });

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

      return { tenant, branch, owner, subscription, plan };
    });

    await this.logAction(
      adminUserId,
      'PROVISION',
      'Tenant',
      result.tenant.id,
      null,
      { restaurantName: data.restaurantName, ownerEmail: data.ownerEmail, plan: result.plan?.name },
      ip,
    );

    this.logger.log(`Provisioned restaurant: ${result.tenant.name} (${result.tenant.slug}) by admin ${adminUserId}`);

    return {
      restaurant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        address: result.tenant.address,
        city: result.tenant.city,
        state: result.tenant.state,
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
    };
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
