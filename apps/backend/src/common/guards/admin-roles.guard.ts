import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export const ADMIN_ROLES_KEY = 'adminRoles';

export const AdminRoles = (...roles: string[]) => SetMetadata(ADMIN_ROLES_KEY, roles);

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const admin = request.admin;
    if (!admin) throw new ForbiddenException('Admin context required');

    const ok = requiredRoles.some((role) => admin.role === role);
    if (!ok) throw new ForbiddenException('Insufficient admin privileges');
    return true;
  }
}
