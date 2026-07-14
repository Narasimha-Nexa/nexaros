import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const RESTRICTED_MODE_ALLOWED = [
  'pos',
  'orders',
  'kitchen',
  'tables',
  'payments',
  'invoices',
];

@Injectable()
export class EntitlementsGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    if (!tenantId) return true;

    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return true;

    if (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL') {
      return true;
    }

    if (subscription.status === 'RESTRICTED') {
      const entitlements = subscription.entitlements as Record<string, boolean>;
      const moduleKey = request.headers['x-module-key'] as string;
      if (moduleKey && RESTRICTED_MODE_ALLOWED.includes(moduleKey)) {
        return true;
      }
      if (moduleKey && entitlements[moduleKey]) {
        return true;
      }
      throw new ForbiddenException(
        'This feature requires an active subscription',
      );
    }

    if (
      subscription.status === 'PAYMENT_PENDING' ||
      subscription.status === 'GRACE_PERIOD'
    ) {
      return true;
    }

    throw new ForbiddenException(
      'Your subscription is not active. Please renew to access this feature.',
    );
  }
}
