/**
 * What the JWT strategy (Phase 2) puts on `request.user`.
 * The tenant comes ONLY from here, never from the URL or body (ADR-002).
 */
export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  /** Placeholder roles until Q-39/Q-40. ASSUMPTION A-33. */
  role: string;
}
