import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('audit trail (integration)', () => {
  let t: TestApp;
  let a: TenantFixture;
  let b: TenantFixture;

  const api = (path: string) => `/api/v1${path}`;
  const as = (who: TenantFixture) => ({
    get: (path: string) => request(t.http).get(api(path)).set('Authorization', who.auth),
    post: (path: string, body: object) =>
      request(t.http).post(api(path)).set('Authorization', who.auth).send(body),
    patch: (path: string, body: object) =>
      request(t.http).patch(api(path)).set('Authorization', who.auth).send(body),
  });

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.app.close();
  });
  beforeEach(async () => {
    await truncateAll(t.prisma);
    ({ a, b } = await createTwoTenants(t.prisma, t.http));
  });

  it('records every successful change with its author (10.2, Q-54)', async () => {
    const created = await as(a).post('/clients', { name: 'MARECOMSA', code: 'MAR' }).expect(201);
    const clientId = created.body.data.id as string;
    await as(a).patch(`/clients/${clientId}`, { contactName: 'Ing. J.' }).expect(200);
    // Failed and read requests leave no trace.
    await as(a).post('/clients', { name: '' }).expect(400);
    await as(a).get('/clients').expect(200);
    // Passwords never reach the trail.
    await as(a)
      .post('/users', {
        email: 'c@lab-a.test',
        fullName: 'Coordinador',
        role: 'QMS_COORDINATOR',
        password: 'secreto-12345',
      })
      .expect(201);

    const res = await as(a).get('/audit-events').expect(200);
    const events = res.body.data as {
      action: string;
      entityType: string;
      entityId: string | null;
      actor: { fullName: string };
      payload: Record<string, unknown>;
      statusCode: number;
    }[];
    expect(events.map((e) => e.action)).toEqual([
      'POST /users',
      'PATCH /clients/:id',
      'POST /clients',
    ]);
    expect(events[2]).toMatchObject({
      entityType: 'clients',
      entityId: clientId,
      statusCode: 201,
      actor: { fullName: 'Admin lab-a' },
      payload: { name: 'MARECOMSA', code: 'MAR' },
    });
    expect(events[0].payload.password).toBe('[redactado]');

    const forClient = await as(a).get(`/audit-events?entityId=${clientId}`).expect(200);
    expect(forClient.body.data).toHaveLength(2);
    // Other labs see nothing; login isn't audited.
    expect((await as(b).get('/audit-events').expect(200)).body.data).toEqual([]);
  });

  it('is readable only by roles with audit.read', async () => {
    await t.prisma.user.update({ where: { id: a.userId }, data: { role: 'LAB_MANAGER' } });
    await as(a).get('/audit-events').expect(403);
  });
});
