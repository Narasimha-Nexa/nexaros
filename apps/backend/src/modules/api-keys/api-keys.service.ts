import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    userId: string,
    data: { name: string; permissions: string[]; expiresAt?: Date },
  ) {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: data.name,
        keyHash,
        keyPrefix,
        permissions: data.permissions,
        expiresAt: data.expiresAt || null,
        createdBy: userId,
      },
    });

    this.logger.log(`API key created: ${apiKey.id} for tenant ${tenantId}`);

    return {
      ...apiKey,
      rawKey,
    };
  }

  async list(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(tenantId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    if (!key.isActive) {
      throw new BadRequestException('API key is already revoked');
    }

    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }

  async rotate(tenantId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 8);

    const newKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: key.name,
        keyHash,
        keyPrefix,
        permissions: key.permissions,
        expiresAt: key.expiresAt,
        createdBy: key.createdBy,
      },
    });

    this.logger.log(`API key rotated: ${keyId} -> ${newKey.id} for tenant ${tenantId}`);

    return {
      ...newKey,
      rawKey,
    };
  }

  async validate(keyHash: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey) {
      return null;
    }

    if (!apiKey.isActive) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      tenantId: apiKey.tenantId,
      permissions: apiKey.permissions,
    };
  }

  async delete(tenantId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return this.prisma.apiKey.delete({
      where: { id: keyId },
    });
  }
}
