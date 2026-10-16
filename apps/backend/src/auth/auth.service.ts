import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User, UserRole } from '../generated/prisma/client.js';
import type { Env } from '../shared/config/env.validation.js';
import { CalendarDate, calendarDateInTimeZone } from '../shared/dates/calendar-date.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { hashPassword, verifyPassword } from './domain/password.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  refreshTokenState,
} from './domain/refresh-token.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserView {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginResult {
  user: AuthUserView;
  tokens: TokenPair;
}

export interface TenantView {
  id: string;
  name: string;
  slug: string;
  /** IANA timezone used for "today" (ASSUMPTION A-14). */
  timezone: string;
}

/** `GET /me`. */
export interface MeView {
  user: AuthUserView;
  tenant: TenantView;
}

/** Claims of the access token. The tenant comes ONLY from here (ADR-002). */
interface AccessTokenClaims {
  sub: string;
  tenantId: string;
  role: UserRole;
}

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_REFRESH = 'Invalid or expired refresh token';

@Injectable()
export class AuthService {
  /** Compared against when the email doesn't exist, so response time doesn't reveal it. */
  private readonly dummyHash: Promise<string> = hashPassword('timing-equalizer');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Login is the one lookup that is not tenant-scoped: the email is globally unique
   * (ASSUMPTION A-32) and the tenant is what we are about to learn.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !passwordOk || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return { user: toView(user), tokens: await this.issueTokens(user) };
  }

  /** Rotates the refresh token. Reusing a revoked one revokes all of the user's tokens. */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const now = new Date();
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      include: { user: true },
    });

    const state = refreshTokenState(row, now);
    if (state === 'REVOKED' && row) {
      await this.prisma.refreshToken.updateMany({
        where: { tenantId: row.tenantId, userId: row.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    }
    if (state !== 'VALID' || !row || !row.user.isActive) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    // Conditional revoke: if two refreshes race, only one wins the rotation.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: row.id, tenantId: row.tenantId, revokedAt: null },
      data: { revokedAt: now },
    });
    if (count !== 1) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    return this.issueTokens(row.user);
  }

  /** Idempotent: an unknown or already revoked token is not an error. */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * The principal's own user and tenant. A user deactivated after the token was issued
   * gets 401, the same as an invalid token.
   */
  async me(tenantId: string, userId: string): Promise<MeView> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true },
      include: { tenant: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }
    const { tenant } = user;
    return {
      user: toView(user),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, timezone: tenant.timezone },
    };
  }

  /** "Today" for the lab: the calendar date in its timezone (A-14). */
  async tenantToday(tenantId: string, now: Date = new Date()): Promise<CalendarDate> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timezone: true },
    });
    if (!tenant) throw new UnauthorizedException('Unknown tenant');
    return calendarDateInTimeZone(tenant.timezone, now);
  }

  /** For other modules (reports): the lab's name and contact data, and its "today". */
  async tenantProfile(tenantId: string): Promise<{
    name: string;
    legalName: string | null;
    address: string | null;
    phone: string | null;
    today: CalendarDate;
  }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Unknown tenant');
    return {
      name: tenant.name,
      legalName: tenant.legalName,
      address: tenant.address,
      phone: tenant.phone,
      today: calendarDateInTimeZone(tenant.timezone),
    };
  }

  /** Used by the JWT guard. Throws 401 for any invalid, expired or malformed token. */
  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    if (typeof claims.sub !== 'string' || typeof claims.tenantId !== 'string') {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return { userId: claims.sub, tenantId: claims.tenantId, role: claims.role };
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const claims: AccessTokenClaims = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken = await this.jwt.signAsync(claims, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      algorithm: 'HS256',
      expiresIn: this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
    });

    const refreshToken = generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshTokenExpiry(
          new Date(),
          this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }),
        ),
      },
    });
    return { accessToken, refreshToken };
  }
}

function toView(user: User): AuthUserView {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
  };
}
