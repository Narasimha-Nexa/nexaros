import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

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
      const payload = jwt.verify(token, ADMIN_JWT_SECRET) as {
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
