import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create tenant + user + default role in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create tenant
      const slug = dto.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check slug uniqueness — append random suffix if collision
      let finalSlug = slug;
      const existingSlug = await tx.tenant.findUnique({ where: { slug } });
      if (existingSlug) {
        finalSlug = `${slug}-${Date.now().toString(36)}`;
      }

      const tenant = await tx.tenant.create({
        data: {
          name: dto.restaurantName,
          slug: finalSlug,
          phone: dto.phone,
          email: dto.email,
        },
      });

      // 2. Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'OWNER',
        },
      });

      // 3. Create default permissions
      const permissions = await Promise.all(
        this.getDefaultPermissions().map((p) =>
          tx.permission.upsert({
            where: { module_action: { module: p.module, action: p.action } },
            update: {},
            create: p,
          }),
        ),
      );

      // 4. Create Owner role with all permissions
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

      // 5. Create default branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: `${dto.restaurantName} - Main`,
          isPrimary: true,
        },
      });

      return { tenant, user, ownerRole, branch };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.tenant.id);

    // Store refresh token
    await this.storeRefreshToken(result.user.id, tokens.refreshToken);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      branch: {
        id: result.branch.id,
        name: result.branch.name,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        tenant: { select: { id: true, name: true, slug: true, isActive: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.tenant.isActive) {
      throw new UnauthorizedException('Restaurant account is suspended');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.tenantId);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: user.tenant,
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token exists and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(
        storedToken.userId,
        storedToken.user.tenantId,
      );

      // Store new refresh token
      await this.storeRefreshToken(storedToken.userId, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    // Store reset token as a refresh token entry with a short expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // In production, send email here. For now, return token for dev.
    return {
      message: 'If an account exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid reset token');
      }

      // Check if token exists and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: dto.token },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new BadRequestException('Reset token expired or invalid');
      }

      // Delete the reset token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      // Revoke all existing refresh tokens for this user
      await this.prisma.refreshToken.deleteMany({
        where: { userId: payload.sub },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            phone: true,
            email: true,
            address: true,
            gstNumber: true,
            currency: true,
            timezone: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(userId: string, tenantId: string) {
    const payload = { sub: userId, tenantId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');
    const expiresAt = new Date();

    // Parse the duration string (e.g., '7d', '24h', '60m')
    const match = expiresIn.match(/^(\d+)([dhm])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      switch (unit) {
        case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
        case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
        case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
      }
    } else {
      // Fallback: assume days
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  private getDefaultPermissions() {
    const modules = [
      'dashboard',
      'orders',
      'menu',
      'tables',
      'inventory',
      'payments',
      'invoices',
      'staff',
      'reservations',
      'reports',
      'settings',
      'branches',
      'suppliers',
      'purchases',
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
}
