import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { createTwoTenants } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('GET /me (integration)', () => {
  let t: TestApp;
  const jwt = new JwtService();
  const secret = () => process.env.JWT_ACCESS_SECRET as string;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.app.close();
  });
  beforeEach(async () => {
    await truncateAll(t.prisma);
  });

  it('returns the signed-in user and their own tenant', async () => {
    const { a, b } = await createTwoTenants(t.prisma, t.http);

    const resA = await request(t.http).get('/api/v1/me').set('Authorization', a.auth).expect(200);
    expect(resA.body.data).toEqual({
      user: {
        id: a.userId,
        email: a.email,
        fullName: 'Admin lab-a',
        role: 'QUALITY_MANAGER',
        isActive: true,
      },
      tenant: {
        id: a.tenantId,
        name: 'Laboratorio lab-a',
        slug: 'lab-a',
        timezone: 'America/Mexico_City',
      },
      permissions: [
        'catalogs.manage',
        'records.capture',
        'reports.prepare',
        'reports.issue',
        'users.manage',
        'audit.read',
      ],
    });

    const resB = await request(t.http).get('/api/v1/me').set('Authorization', b.auth).expect(200);
    expect(resB.body.data.tenant.id).toBe(b.tenantId);
    expect(resB.body.data.user.id).toBe(b.userId);
  });

  it('requires a token', async () => {
    const res = await request(t.http).get('/api/v1/me').expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a token whose tenant was changed (signature check)', async () => {
    const { a, b } = await createTwoTenants(t.prisma, t.http);
    const [header, payload, signature] = a.accessToken.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as object;
    const forged = Buffer.from(JSON.stringify({ ...claims, tenantId: b.tenantId })).toString(
      'base64url',
    );
    await request(t.http)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${header}.${forged}.${signature}`)
      .expect(401);
  });

  it('rejects an expired token and one signed with another secret', async () => {
    const { a } = await createTwoTenants(t.prisma, t.http);
    const claims = { sub: a.userId, tenantId: a.tenantId, role: 'QUALITY_MANAGER' };
    const expired = await jwt.signAsync(
      { ...claims, exp: Math.floor(Date.now() / 1000) - 60 },
      { secret: secret() },
    );
    const otherSecret = await jwt.signAsync(claims, { secret: 'x'.repeat(40), expiresIn: 60 });
    for (const token of [expired, otherSecret]) {
      await request(t.http).get('/api/v1/me').set('Authorization', `Bearer ${token}`).expect(401);
    }
  });

  it('a valid token pairing a user with another tenant finds nothing', async () => {
    // Defence in depth: even a correctly signed token can't read across tenants,
    // because the lookup is scoped by (userId, tenantId).
    const { a, b } = await createTwoTenants(t.prisma, t.http);
    const crossed = await jwt.signAsync(
      { sub: a.userId, tenantId: b.tenantId, role: 'QUALITY_MANAGER' },
      { secret: secret(), expiresIn: 60 },
    );
    await request(t.http).get('/api/v1/me').set('Authorization', `Bearer ${crossed}`).expect(401);
  });

  it('rejects a user deactivated after login', async () => {
    const { a } = await createTwoTenants(t.prisma, t.http);
    await t.prisma.user.updateMany({
      where: { id: a.userId, tenantId: a.tenantId },
      data: { isActive: false },
    });
    await request(t.http).get('/api/v1/me').set('Authorization', a.auth).expect(401);
  });
});
