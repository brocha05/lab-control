import { verifyPassword } from '../auth/domain/password.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';
import type { CreateTenantInput } from './create-tenant.args.js';
import { createTenantWithAdmin, TenantAlreadyExistsError } from './create-tenant.js';

const input: CreateTenantInput = {
  tenant: { name: 'CCP', slug: 'ccp', timezone: 'America/Mexico_City', legalName: 'CCP S.A.' },
  admin: { email: 'admin@ccp.test', fullName: 'Admin CCP', password: 'a-long-password' },
  passwordGenerated: false,
};

describe('createTenantWithAdmin (integration)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.app.close();
  });
  beforeEach(async () => {
    await truncateAll(t.prisma);
  });

  it('creates the tenant and a hashed ADMIN user', async () => {
    const { tenantId, adminUserId } = await createTenantWithAdmin(t.prisma, input);
    const user = await t.prisma.user.findFirstOrThrow({ where: { id: adminUserId, tenantId } });
    expect(user.role).toBe('ADMIN');
    expect(user.passwordHash).not.toContain('a-long-password');
    await expect(verifyPassword('a-long-password', user.passwordHash)).resolves.toBe(true);
  });

  it('fails cleanly and creates nothing on a duplicate', async () => {
    await createTenantWithAdmin(t.prisma, input);
    await expect(
      createTenantWithAdmin(t.prisma, { ...input, tenant: { ...input.tenant, slug: 'other' } }),
    ).rejects.toBeInstanceOf(TenantAlreadyExistsError);
    // The transaction rolled back: the second tenant was not left without users.
    await expect(t.prisma.tenant.count()).resolves.toBe(1);
  });
});
