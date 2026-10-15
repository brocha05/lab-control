import request from 'supertest';
import { createTenantFixture, createTwoTenants } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('auth (integration)', () => {
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

  it('logs in and returns the user and a token pair', async () => {
    const a = await createTenantFixture(t.prisma, t.http, 'lab-a');
    const res = await request(t.http)
      .post('/api/v1/auth/login')
      .send({ email: ' ADMIN@lab-a.test ', password: a.password })
      .expect(200);

    expect(res.body.data.user).toEqual({
      id: a.userId,
      email: a.email,
      fullName: 'Admin lab-a',
      role: 'ADMIN',
      isActive: true,
    });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.tokens).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    await createTenantFixture(t.prisma, t.http, 'lab-a');
    const wrong = await request(t.http)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@lab-a.test', password: 'wrong-password' })
      .expect(401);
    const unknown = await request(t.http)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@lab-a.test', password: 'wrong-password' })
      .expect(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('rejects a deactivated user', async () => {
    const a = await createTenantFixture(t.prisma, t.http, 'lab-a');
    await t.prisma.user.updateMany({
      where: { id: a.userId, tenantId: a.tenantId },
      data: { isActive: false },
    });
    await request(t.http)
      .post('/api/v1/auth/login')
      .send({ email: a.email, password: a.password })
      .expect(401);
  });

  it('rotates the refresh token and detects reuse', async () => {
    const a = await createTenantFixture(t.prisma, t.http, 'lab-a');
    const rotated = await request(t.http)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: a.refreshToken })
      .expect(200);
    const next = rotated.body.data.refreshToken as string;
    expect(next).not.toBe(a.refreshToken);

    // Replaying the old token revokes the whole session family, including `next`.
    await request(t.http)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: a.refreshToken })
      .expect(401);
    await request(t.http).post('/api/v1/auth/refresh').send({ refreshToken: next }).expect(401);
  });

  it('logs out idempotently', async () => {
    const a = await createTenantFixture(t.prisma, t.http, 'lab-a');
    await request(t.http)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: a.refreshToken })
      .expect(204);
    await request(t.http)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: a.refreshToken })
      .expect(204);
    await request(t.http)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: a.refreshToken })
      .expect(401);
  });

  it('reuse in one tenant does not revoke the other tenant’s sessions', async () => {
    const { a, b } = await createTwoTenants(t.prisma, t.http);
    await request(t.http).post('/api/v1/auth/refresh').send({ refreshToken: a.refreshToken });
    await request(t.http)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: a.refreshToken })
      .expect(401);
    await request(t.http)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: b.refreshToken })
      .expect(200);
  });

  it('keeps /health public', async () => {
    await request(t.http).get('/api/v1/health').expect(200);
  });
});
