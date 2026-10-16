import type { Server } from 'node:http';
import request from 'supertest';
import { createTenantWithAdmin } from '../cli/create-tenant.js';
import type { PrismaService } from '../shared/prisma/prisma.service.js';

export interface TenantFixture {
  tenantId: string;
  userId: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  /** `Authorization` header value for supertest's `.set()`. */
  auth: string;
}

const PASSWORD = 'integration-password-1';

/** Creates a tenant with its QUALITY_MANAGER (same code path as the CLI) and logs in. */
export async function createTenantFixture(
  prisma: PrismaService,
  http: Server,
  slug: string,
): Promise<TenantFixture> {
  const email = `admin@${slug}.test`;
  const { tenantId, adminUserId } = await createTenantWithAdmin(prisma, {
    tenant: { name: `Laboratorio ${slug}`, slug, timezone: 'America/Mexico_City' },
    admin: { email, fullName: `Admin ${slug}`, password: PASSWORD },
    passwordGenerated: false,
  });

  const res = await request(http)
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  const { accessToken, refreshToken } = res.body.data.tokens as {
    accessToken: string;
    refreshToken: string;
  };

  return {
    tenantId,
    userId: adminUserId,
    email,
    password: PASSWORD,
    accessToken,
    refreshToken,
    auth: `Bearer ${accessToken}`,
  };
}

/**
 * Two isolated laboratories. Every module's integration test uses this to assert that
 * tenant B gets 404 on tenant A's resources (docs/architecture/multi-tenancy.md).
 */
export async function createTwoTenants(
  prisma: PrismaService,
  http: Server,
): Promise<{ a: TenantFixture; b: TenantFixture }> {
  const a = await createTenantFixture(prisma, http, 'lab-a');
  const b = await createTenantFixture(prisma, http, 'lab-b');
  return { a, b };
}
