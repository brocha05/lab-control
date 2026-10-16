import type { UserRole } from '../../generated/prisma/client.js';

/**
 * What the global JwtAuthGuard (src/auth/jwt-auth.guard.ts) puts on `request.user`.
 * The tenant comes ONLY from here, never from the URL or body (ADR-002).
 */
export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  /** The lab's roles (Q-39). Permissions are enforced in development-plan 10.1. */
  role: UserRole;
}
