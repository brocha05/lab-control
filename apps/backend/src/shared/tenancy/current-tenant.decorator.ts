import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.js';

function getUser(ctx: ExecutionContext): AuthenticatedUser {
  const req = ctx.switchToHttp().getRequest<Request & { user?: Partial<AuthenticatedUser> }>();
  if (!req.user?.tenantId) {
    throw new UnauthorizedException();
  }
  return req.user as AuthenticatedUser;
}

/** `@CurrentTenant() tenantId: string`: pass it as the first argument of every service call. */
export const CurrentTenant = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  return getUser(ctx).tenantId;
});

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => getUser(ctx),
);
