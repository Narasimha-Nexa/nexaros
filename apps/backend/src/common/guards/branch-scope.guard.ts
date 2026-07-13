import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard that validates the branchId (from query or body) belongs to the
 * authenticated user's tenant. Prevents cross-tenant data access.
 *
 * Apply to any controller method that accepts a branchId parameter:
 *   @UseGuards(BranchScopeGuard)
 *
 * Works with both query param (?branchId=) and body param { branchId: }.
 */
@Injectable()
export class BranchScopeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.tenantId) return true;

    // Owners bypass tenant scoping
    if (user.role === 'OWNER') return true;

    // Extract branchId from query, body, or param
    const branchId =
      request.query?.branchId ||
      request.body?.branchId ||
      request.params?.branchId;

    if (!branchId) return true;

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { tenantId: true },
    });

    if (!branch || branch.tenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied: branch does not belong to your organization');
    }

    return true;
  }
}
