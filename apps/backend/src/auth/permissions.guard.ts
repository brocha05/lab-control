import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { can, type Permission } from './domain/permissions.js';

const PERMISSION_KEY = 'requiredPermission';

/** Marks a route (or controller) as needing a permission of the user's role. */
export const RequirePermission = (permission: Permission) =>
  SetMetadata(PERMISSION_KEY, permission);

/**
 * Global guard, after JwtAuthGuard: 403 when the role lacks the route's permission.
 * Routes without `@RequirePermission` (reads) are open to every role of the lab.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;
    const user = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>().user;
    if (!user || !can(user.role, permission)) {
      throw new ForbiddenException('Your position in the lab can not do this');
    }
    return true;
  }
}
