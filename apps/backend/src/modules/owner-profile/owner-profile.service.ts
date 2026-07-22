import {
  Injectable, Logger, NotFoundException, BadRequestException,
  ConflictException, UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OwnerProfileService {
  private readonly logger = new Logger(OwnerProfileService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find owner by email — used during provisioning to detect existing owners.
   */
  async findByEmail(email: string) {
    return this.prisma.ownerProfile.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
      include: {
        tenants: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            subdomain: true,
            status: true,
            branches: {
              where: { deletedAt: null },
              select: { id: true, name: true, displayName: true, status: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find owner by phone.
   */
  async findByPhone(phone: string) {
    return this.prisma.ownerProfile.findFirst({
      where: { phone: phone.trim(), deletedAt: null },
      include: { tenants: { where: { deletedAt: null }, select: { id: true, name: true } } },
    });
  }

  /**
   * Find owner by ID.
   */
  async findById(id: string) {
    const owner = await this.prisma.ownerProfile.findFirst({
      where: { id, deletedAt: null },
      include: {
        tenants: {
          where: { deletedAt: null },
          select: {
            id: true, name: true, slug: true, subdomain: true, status: true,
            branches: {
              where: { deletedAt: null },
              select: { id: true, name: true, displayName: true, status: true },
            },
          },
        },
      },
    });
    if (!owner) throw new NotFoundException('Owner profile not found');
    return owner;
  }

  /**
   * Create a new owner profile.
   */
  async create(data: {
    email: string;
    password?: string;
    name: string;
    phone?: string;
  }) {
    const email = data.email.toLowerCase().trim();

    const existing = await this.prisma.ownerProfile.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    if (data.phone) {
      const existingPhone = await this.prisma.ownerProfile.findFirst({
        where: { phone: data.phone.trim(), deletedAt: null },
      });
      if (existingPhone) {
        throw new ConflictException('An account with this phone number already exists');
      }
    }

    const password = data.password || this.generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const owner = await this.prisma.ownerProfile.create({
      data: {
        email,
        phone: data.phone?.trim() || null,
        password: hashedPassword,
        name: data.name.trim(),
        isActive: true,
      },
    });

    return { owner, plainPassword: password };
  }

  /**
   * Authenticate owner by email + password.
   */
  async authenticate(email: string, password: string) {
    const owner = await this.prisma.ownerProfile.findFirst({
      where: { email: email.toLowerCase().trim(), isActive: true, deletedAt: null },
    });
    if (!owner) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, owner.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.ownerProfile.update({
      where: { id: owner.id },
      data: { lastLoginAt: new Date() },
    });

    return owner;
  }

  /**
   * Update owner profile.
   */
  async update(id: string, data: { name?: string; phone?: string; avatar?: string }) {
    const owner = await this.findById(id);
    return this.prisma.ownerProfile.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.phone && { phone: data.phone.trim() }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    });
  }

  /**
   * Change password.
   */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const owner = await this.prisma.ownerProfile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!owner) throw new NotFoundException('Owner not found');

    const valid = await bcrypt.compare(currentPassword, owner.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.ownerProfile.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * List all owner profiles (super admin).
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, search = '' } = params;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [owners, total] = await Promise.all([
      this.prisma.ownerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { tenants: true } },
        },
      }),
      this.prisma.ownerProfile.count({ where }),
    ]);

    return {
      data: owners.map((o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        isActive: o.isActive,
        lastLoginAt: o.lastLoginAt,
        tenantCount: o._count.tenants,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Deactivate an owner profile (soft).
   */
  async deactivate(id: string) {
    await this.findById(id);
    return this.prisma.ownerProfile.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Reactivate an owner profile.
   */
  async reactivate(id: string) {
    await this.findById(id);
    return this.prisma.ownerProfile.update({
      where: { id },
      data: { isActive: true },
    });
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
