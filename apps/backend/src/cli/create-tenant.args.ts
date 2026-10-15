import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { MIN_PASSWORD_LENGTH } from '../auth/domain/password.js';

export interface CreateTenantInput {
  tenant: { name: string; slug: string; timezone: string; legalName?: string };
  admin: { email: string; fullName: string; password: string };
  /** True when no ADMIN_PASSWORD was given and one was generated (print it once). */
  passwordGenerated: boolean;
}

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

export const USAGE = `Usage:
  ADMIN_PASSWORD=... pnpm cli:create-tenant \\
    --name "CCP Colima" --slug ccp --timezone America/Mexico_City \\
    --admin-email admin@example.com --admin-name "Nombre Apellido" \\
    [--legal-name "CONTROL DE CALIDAD Y PROYECTOS, S.A. DE C.V."]

Without ADMIN_PASSWORD a random password is generated and printed once.`;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Pure: parses and validates, listing every problem at once. */
export function parseCreateTenantArgs(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): CreateTenantInput {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      name: { type: 'string' },
      slug: { type: 'string' },
      timezone: { type: 'string' },
      'legal-name': { type: 'string' },
      'admin-email': { type: 'string' },
      'admin-name': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  });

  const errors: string[] = [];
  const name = values.name?.trim() ?? '';
  const slug = values.slug?.trim() ?? '';
  const timezone = values.timezone?.trim() ?? '';
  const email = values['admin-email']?.trim().toLowerCase() ?? '';
  const fullName = values['admin-name']?.trim() ?? '';
  const legalName = values['legal-name']?.trim() || undefined;

  if (!name) errors.push('--name is required');
  if (!SLUG.test(slug)) errors.push('--slug is required: lowercase letters, digits and dashes');
  if (!isValidTimeZone(timezone)) {
    errors.push('--timezone must be an IANA timezone, e.g. America/Mexico_City');
  }
  if (!EMAIL.test(email)) errors.push('--admin-email must be a valid email');
  if (!fullName) errors.push('--admin-name is required');

  const givenPassword = env.ADMIN_PASSWORD;
  if (givenPassword !== undefined && givenPassword.length < MIN_PASSWORD_LENGTH) {
    errors.push(`ADMIN_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (errors.length > 0) {
    throw new CliUsageError(`- ${errors.join('\n- ')}\n\n${USAGE}`);
  }

  return {
    tenant: { name, slug, timezone, legalName },
    admin: { email, fullName, password: givenPassword ?? randomBytes(18).toString('base64url') },
    passwordGenerated: givenPassword === undefined,
  };
}
