import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  refreshTokenState,
} from './refresh-token.js';

describe('refresh tokens', () => {
  const now = new Date('2026-10-14T12:00:00Z');

  it('generates distinct url-safe tokens', () => {
    const a = generateRefreshToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateRefreshToken()).not.toBe(a);
  });

  it('hashes deterministically to hex SHA-256', () => {
    expect(hashRefreshToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('computes the expiry from the TTL in days', () => {
    expect(refreshTokenExpiry(now, 7).toISOString()).toBe('2026-10-21T12:00:00.000Z');
  });

  it.each([
    [null, 'UNKNOWN'],
    [{ revokedAt: now, expiresAt: new Date('2026-10-20T00:00:00Z') }, 'REVOKED'],
    [{ revokedAt: null, expiresAt: now }, 'EXPIRED'],
    [{ revokedAt: null, expiresAt: new Date('2026-10-14T12:00:01Z') }, 'VALID'],
  ] as const)('classifies %o as %s', (row, expected) => {
    expect(refreshTokenState(row, now)).toBe(expected);
  });
});
