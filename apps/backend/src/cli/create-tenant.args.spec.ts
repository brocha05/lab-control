import { CliUsageError, parseCreateTenantArgs } from './create-tenant.args.js';

const valid = [
  '--name',
  'CCP Colima',
  '--slug',
  'ccp',
  '--timezone',
  'America/Mexico_City',
  '--admin-email',
  ' Admin@Example.com ',
  '--admin-name',
  'Ana Pérez',
];

describe('parseCreateTenantArgs', () => {
  it('parses valid arguments and normalizes the email', () => {
    const input = parseCreateTenantArgs(valid, { ADMIN_PASSWORD: 'a-long-password' });
    expect(input).toEqual({
      tenant: {
        name: 'CCP Colima',
        slug: 'ccp',
        timezone: 'America/Mexico_City',
        legalName: undefined,
      },
      admin: { email: 'admin@example.com', fullName: 'Ana Pérez', password: 'a-long-password' },
      passwordGenerated: false,
    });
  });

  it('generates a password when ADMIN_PASSWORD is missing', () => {
    const input = parseCreateTenantArgs(valid, {});
    expect(input.passwordGenerated).toBe(true);
    expect(input.admin.password.length).toBeGreaterThanOrEqual(20);
  });

  it('lists every problem at once', () => {
    let error: unknown;
    try {
      parseCreateTenantArgs(['--slug', 'Bad Slug', '--timezone', 'Mars/Base'], {
        ADMIN_PASSWORD: 'short',
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(CliUsageError);
    const message = (error as Error).message;
    for (const flag of ['--name', '--slug', '--timezone', '--admin-email', '--admin-name']) {
      expect(message).toContain(flag);
    }
    expect(message).toContain('ADMIN_PASSWORD');
  });

  it('rejects unknown flags', () => {
    expect(() => parseCreateTenantArgs([...valid, '--tenant-id', 'x'], {})).toThrow();
  });
});
