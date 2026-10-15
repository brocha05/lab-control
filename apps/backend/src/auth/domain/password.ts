/**
 * Password hashing with Node's built-in scrypt (no native dependency).
 * Stored format: `scrypt$<N>$<r>$<p>$<salt base64url>$<hash base64url>`, so the cost
 * parameters can be raised later without breaking existing hashes.
 */
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const ALGORITHM = 'scrypt';
const COST = { N: 2 ** 15, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export const MIN_PASSWORD_LENGTH = 10;

function deriveKey(
  password: string,
  salt: Buffer,
  cost: { N: number; r: number; p: number },
): Promise<Buffer> {
  // scrypt needs 128 * N * r bytes; Node's default maxmem (32 MiB) is exactly that at N=2^15.
  const options: ScryptOptions = { ...cost, maxmem: 256 * cost.N * cost.r };
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, COST);
  return [
    ALGORITHM,
    COST.N,
    COST.r,
    COST.p,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

/** `false` for a wrong password or a hash in an unknown format. Never throws on bad input. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0)) return false;

  const salt = Buffer.from(parts[4], 'base64url');
  const expected = Buffer.from(parts[5], 'base64url');
  if (salt.length === 0 || expected.length !== KEY_LENGTH) return false;

  const actual = await deriveKey(password, salt, { N, r, p });
  return timingSafeEqual(actual, expected);
}
