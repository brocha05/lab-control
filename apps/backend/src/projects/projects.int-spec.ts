import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('projects (integration)', () => {
  let t: TestApp;
  let a: TenantFixture;
  let b: TenantFixture;

  const api = (path: string) => `/api/v1${path}`;
  type Body = { data: { id: string; location?: string | null }; error: { details: string[] } };
  const post = async (who: TenantFixture, path: string, body: object, status = 201) =>
    (await request(t.http).post(api(path)).set('Authorization', who.auth).send(body).expect(status))
      .body as Body;
  const names = (res: request.Response) =>
    (res.body.data.items as { name: string }[]).map((p) => p.name);

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

  it('creates a project under the tenant’s client and returns the client name', async () => {
    const client = (await post(a, '/clients', { name: 'MARECOMSA S.A. DE C.V.', code: 'MAR' }))
      .data;
    const project = (
      await post(a, '/projects', {
        clientId: client.id,
        name: 'CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"',
        code: 'pvlt',
        location: 'Las Tunas, Tepames, Colima',
      })
    ).data;

    expect(project).toMatchObject({
      name: 'CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"',
      code: 'PVLT',
      location: 'Las Tunas, Tepames, Colima',
      client: { id: client.id, name: 'MARECOMSA S.A. DE C.V.' },
    });

    const updated = await request(t.http)
      .patch(api(`/projects/${project.id}`))
      .set('Authorization', a.auth)
      .send({ location: '' })
      .expect(200);
    expect(updated.body.data.location).toBeNull();
  });

  it('lists, filters by client and searches name or location', async () => {
    const c1 = (await post(a, '/clients', { name: 'Cliente 1', code: 'CUNO' })).data;
    const c2 = (await post(a, '/clients', { name: 'Cliente 2', code: 'CDOS' })).data;
    await post(a, '/projects', {
      clientId: c1.id,
      name: 'Puente',
      code: 'PTE',
      location: 'Colima',
    });
    await post(a, '/projects', {
      clientId: c1.id,
      name: 'Escuela',
      code: 'ESC',
      location: 'Manzanillo',
    });
    await post(a, '/projects', {
      clientId: c2.id,
      name: 'Hospital',
      code: 'HOS',
      location: 'Colima',
    });
    const cb = (await post(b, '/clients', { name: 'Cliente B', code: 'CBB' })).data;
    await post(b, '/projects', {
      clientId: cb.id,
      name: 'Aeropuerto',
      code: 'AER',
      location: 'Colima',
    });

    const all = await request(t.http).get(api('/projects')).set('Authorization', a.auth);
    expect(names(all)).toEqual(['Escuela', 'Hospital', 'Puente']);

    const byClient = await request(t.http)
      .get(api(`/projects?clientId=${c1.id}`))
      .set('Authorization', a.auth);
    expect(names(byClient)).toEqual(['Escuela', 'Puente']);

    const search = await request(t.http)
      .get(api('/projects?q=colima'))
      .set('Authorization', a.auth);
    expect(names(search)).toEqual(['Hospital', 'Puente']);
  });

  it('refuses another tenant’s client with 404, on create and on update', async () => {
    const own = (await post(a, '/clients', { name: 'Propio', code: 'PRO' })).data;
    const foreign = (await post(b, '/clients', { name: 'Ajeno', code: 'AJE' })).data;

    await post(a, '/projects', { clientId: foreign.id, name: 'Obra', code: 'OBR' }, 404);

    const project = (await post(a, '/projects', { clientId: own.id, name: 'Obra', code: 'OBR' }))
      .data;
    await request(t.http)
      .patch(api(`/projects/${project.id}`))
      .set('Authorization', a.auth)
      .send({ clientId: foreign.id })
      .expect(404);
  });

  it('returns 404 for another tenant’s project', async () => {
    const client = (await post(a, '/clients', { name: 'Cliente A', code: 'CLA' })).data;
    const project = (
      await post(a, '/projects', { clientId: client.id, name: 'Obra A', code: 'OBA' })
    ).data;

    await request(t.http)
      .get(api(`/projects/${project.id}`))
      .set('Authorization', b.auth)
      .expect(404);
    await request(t.http)
      .patch(api(`/projects/${project.id}`))
      .set('Authorization', b.auth)
      .send({ name: 'Secuestrada' })
      .expect(404);
    const listB = await request(t.http).get(api('/projects')).set('Authorization', b.auth);
    expect(listB.body.data.total).toBe(0);
  });

  it('keeps project codes unique per client (409), not across clients', async () => {
    const c1 = (await post(a, '/clients', { name: 'Uno', code: 'UNO' })).data;
    const c2 = (await post(a, '/clients', { name: 'Dos', code: 'DOS' })).data;
    await post(a, '/projects', { clientId: c1.id, name: 'Puente', code: 'PVLT' });
    const dup = await post(a, '/projects', { clientId: c1.id, name: 'Otro', code: 'PVLT' }, 409);
    expect(dup.error).toMatchObject({ code: 'CONFLICT' });
    await post(a, '/projects', { clientId: c2.id, name: 'Puente 2', code: 'PVLT' });
  });

  it('validates input', async () => {
    const res = await post(a, '/projects', { clientId: 'nope', name: '' }, 400);
    expect(res.error.details).toEqual(
      expect.arrayContaining([
        'clientId must be a UUID',
        'name should not be empty',
        'code must be 3 or 4 letters',
      ]),
    );
    await request(t.http)
      .get(api('/projects?clientId=nope'))
      .set('Authorization', a.auth)
      .expect(400);
  });

  describe('test configuration (6.1)', () => {
    let projectId: string;
    beforeEach(async () => {
      const client = (await post(a, '/clients', { name: 'Cliente', code: 'CLI' })).data;
      projectId = (await post(a, '/projects', { clientId: client.id, name: 'Obra', code: 'OBR' }))
        .data.id;
    });
    const put = (who: TenantFixture, body: object) =>
      request(t.http)
        .put(api(`/projects/${projectId}/test-configuration`))
        .set('Authorization', who.auth)
        .send(body);

    it('starts empty, replaces the set and returns it sorted by age', async () => {
      const empty = await request(t.http)
        .get(api(`/projects/${projectId}/test-configuration`))
        .set('Authorization', a.auth)
        .expect(200);
      expect(empty.body.data).toEqual([]);

      const saved = await put(a, {
        ages: [
          { ageDays: 28, specimenCount: 2 },
          { ageDays: 7, specimenCount: 2 },
        ],
      }).expect(200);
      expect(saved.body.data).toEqual([
        { ageDays: 7, specimenCount: 2 },
        { ageDays: 28, specimenCount: 2 },
      ]);

      const replaced = await put(a, { ages: [{ ageDays: 3, specimenCount: 1 }] }).expect(200);
      expect(replaced.body.data).toEqual([{ ageDays: 3, specimenCount: 1 }]);
    });

    it('rejects repeated or invalid ages', async () => {
      await put(a, {
        ages: [
          { ageDays: 7, specimenCount: 2 },
          { ageDays: 7, specimenCount: 1 },
        ],
      }).expect(400);
      await put(a, { ages: [{ ageDays: 0, specimenCount: 2 }] }).expect(400);
      await put(a, { ages: [{ ageDays: 7, specimenCount: 2.5 }] }).expect(400);
    });

    it('returns 404 for another lab', async () => {
      await request(t.http)
        .get(api(`/projects/${projectId}/test-configuration`))
        .set('Authorization', b.auth)
        .expect(404);
      await put(b, { ages: [{ ageDays: 7, specimenCount: 2 }] }).expect(404);
    });
  });
});
