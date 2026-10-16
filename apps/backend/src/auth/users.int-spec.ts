import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('users and permissions (integration)', () => {
  let t: TestApp;
  let a: TenantFixture;
  let b: TenantFixture;

  const api = (path: string) => `/api/v1${path}`;
  const with_ = (auth: string) => ({
    get: (path: string) => request(t.http).get(api(path)).set('Authorization', auth),
    post: (path: string, body: object) =>
      request(t.http).post(api(path)).set('Authorization', auth).send(body),
    patch: (path: string, body: object) =>
      request(t.http).patch(api(path)).set('Authorization', auth).send(body),
  });
  const login = async (email: string, password: string) => {
    const res = await request(t.http)
      .post(api('/auth/login'))
      .send({ email, password })
      .expect(200);
    return `Bearer ${res.body.data.tokens.accessToken as string}`;
  };

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

  it('lets the Jefe de Control de Calidad manage the lab staff (10.1)', async () => {
    const admin = with_(a.auth);
    const me = await admin.get('/me').expect(200);
    expect(me.body.data.permissions).toContain('users.manage');

    const created = await admin
      .post('/users', {
        email: 'Coordinador@Lab-A.test',
        fullName: 'Coordinador SGC',
        role: 'QMS_COORDINATOR',
        password: 'coordinador-123',
      })
      .expect(201);
    const userId = created.body.data.id as string;
    expect(created.body.data).toMatchObject({ email: 'coordinador@lab-a.test', isActive: true });
    expect(created.body.data.passwordHash).toBeUndefined();
    await admin
      .post('/users', {
        email: 'coordinador@lab-a.test',
        fullName: 'Otro',
        role: 'LAB_MANAGER',
        password: 'coordinador-123',
      })
      .expect(409);

    const list = await admin.get('/users').expect(200);
    expect(list.body.data).toHaveLength(2);
    expect((await with_(b.auth).get('/users').expect(200)).body.data).toHaveLength(1);
    await with_(b.auth).patch(`/users/${userId}`, { role: 'LAB_MANAGER' }).expect(404);

    // The coordinator captures but can't manage users or issue reports.
    const coord = with_(await login('coordinador@lab-a.test', 'coordinador-123'));
    const coordMe = await coord.get('/me').expect(200);
    expect(coordMe.body.data.permissions).toEqual([
      'catalogs.manage',
      'records.capture',
      'reports.prepare',
      'audit.read',
    ]);
    await coord.get('/users').expect(403);
    await coord.post('/clients', { name: 'Cliente', code: 'CLI' }).expect(201);

    // A role change applies on the next request.
    await admin.patch(`/users/${userId}`, { role: 'LAB_MANAGER' }).expect(200);
    await coord.post('/clients', { name: 'Otro', code: 'OTR' }).expect(403);
    await coord.get('/clients').expect(200);

    // Deactivated: signed out at once.
    await admin.patch(`/users/${userId}`, { isActive: false }).expect(200);
    await coord.get('/clients').expect(401);
    await request(t.http)
      .post(api('/auth/login'))
      .send({ email: 'coordinador@lab-a.test', password: 'coordinador-123' })
      .expect(401);

    // Password reset, reactivation.
    await admin.patch(`/users/${userId}`, { isActive: true }).expect(200);
    await admin.post(`/users/${userId}/password`, { password: 'nuevo-password-1' }).expect(204);
    await login('coordinador@lab-a.test', 'nuevo-password-1');
  });

  it('keeps an administrator: nobody demotes or deactivates themselves', async () => {
    await with_(a.auth).patch(`/users/${a.userId}`, { role: 'LAB_MANAGER' }).expect(409);
    await with_(a.auth).patch(`/users/${a.userId}`, { isActive: false }).expect(409);
    await with_(a.auth).patch(`/users/${a.userId}`, { fullName: 'Nuevo nombre' }).expect(200);
  });

  it('leaves the paper-based roles read only (A-101)', async () => {
    await with_(a.auth)
      .post('/users', {
        email: 'brigada@lab-a.test',
        fullName: 'Jefe de Brigada',
        role: 'FIELD_CREW_CHIEF',
        password: 'brigada-12345',
      })
      .expect(201);
    const crewAuth = await login('brigada@lab-a.test', 'brigada-12345');
    const crew = with_(crewAuth);
    await crew.get('/projects').expect(200);
    await crew.post('/clients', { name: 'X', code: 'XXX' }).expect(403);
    await crew.post('/holidays', { date: '2026-12-12', name: 'Prueba' }).expect(403);
    await request(t.http)
      .put(api('/tests/results'))
      .set('Authorization', crewAuth)
      .send({})
      .expect(403);
  });
});
