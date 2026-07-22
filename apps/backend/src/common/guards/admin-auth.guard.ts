import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_JWT_SECRET must be set in production');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('Either ADMIN_JWT_SECRET or JWT_SECRET must be set');
    }
    console.warn('ADMIN_JWT_SECRET not set — falling back to JWT_SECRET. Set ADMIN_JWT_SECRET for production.');
    return process.env.JWT_SECRET!;
  }
  return secret;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin authorization token');
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, getAdminJwtSecret()) as {
        adminId: string;
        email: string;
        role: string;
      };

      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.adminId },
      });
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin account not found or disabled');
      }

      request.admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
