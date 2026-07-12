import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Permissions_KEY = 'permissions';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(Permissions_KEY, permissions);
