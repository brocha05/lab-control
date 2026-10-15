/**
 * Refresh tokens are opaque random strings. Only their SHA-256 is stored, so a
 * database leak doesn't hand out live sessions.
 */
import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;
const DAY_MS = 24 * 60 * 60 * 1000;

export function generateRefreshToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(now: Date, ttlDays: number): Date {
  return new Date(now.getTime() + ttlDays * DAY_MS);
}

export type RefreshTokenState = 'VALID' | 'UNKNOWN' | 'REVOKED' | 'EXPIRED';

/**
 * `REVOKED` means a rotated (already used) or logged-out token was presented again.
 * The caller treats that as possible theft and revokes every token of the user.
 */
export function refreshTokenState(
  row: { revokedAt: Date | null; expiresAt: Date } | null,
  now: Date,
): RefreshTokenState {
  if (!row) return 'UNKNOWN';
  if (row.revokedAt) return 'REVOKED';
  if (row.expiresAt.getTime() <= now.getTime()) return 'EXPIRED';
  return 'VALID';
}
