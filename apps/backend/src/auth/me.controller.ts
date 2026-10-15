import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../shared/tenancy/current-tenant.decorator.js';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { AuthService, type MeView } from './auth.service.js';

/** `GET /me`: the signed-in user and their laboratory (development-plan 2.6). */
@Controller('me')
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  me(@CurrentUser() principal: AuthenticatedUser): Promise<MeView> {
    return this.auth.me(principal.tenantId, principal.userId);
  }
}
