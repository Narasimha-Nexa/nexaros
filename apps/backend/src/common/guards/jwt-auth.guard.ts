import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Load user permissions for authorization
      const staffRecord = await this.prisma.staff.findFirst({
        where: { userId: user.id },
        select: {
          roleId: true,
          role: {
            select: {
              permissions: {
                include: {
                  permission: { select: { module: true, action: true } },
                },
              },
            },
          },
        },
      });

      const permissions = staffRecord?.role.permissions.map(
        (rp) => `${rp.permission.module}:${rp.permission.action}`,
      ) || [];

      // Also include base role-based permissions
      if (user.role === 'OWNER') {
        // Owners have full access
        request.user = { ...user, permissions: ['*:*'] };
      } else {
        request.user = { ...user, permissions };
      }
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
