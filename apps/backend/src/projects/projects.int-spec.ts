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
    const client = (await post(a, '/clients', { name: 'MARECOMSA S.A. DE C.V.' })).data;
    const project = (
      await post(a, '/projects', {
        clientId: client.id,
        name: 'CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"',
        location: 'Las Tunas, Tepames, Colima',
      })
    ).data;

    expect(project).toMatchObject({
      name: 'CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"',
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
    const c1 = (await post(a, '/clients', { name: 'Cliente 1' })).data;
    const c2 = (await post(a, '/clients', { name: 'Cliente 2' })).data;
    await post(a, '/projects', { clientId: c1.id, name: 'Puente', location: 'Colima' });
    await post(a, '/projects', { clientId: c1.id, name: 'Escuela', location: 'Manzanillo' });
    await post(a, '/projects', { clientId: c2.id, name: 'Hospital', location: 'Colima' });
    const cb = (await post(b, '/clients', { name: 'Cliente B' })).data;
    await post(b, '/projects', { clientId: cb.id, name: 'Aeropuerto', location: 'Colima' });

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
    const own = (await post(a, '/clients', { name: 'Propio' })).data;
    const foreign = (await post(b, '/clients', { name: 'Ajeno' })).data;

    await post(a, '/projects', { clientId: foreign.id, name: 'Obra' }, 404);

    const project = (await post(a, '/projects', { clientId: own.id, name: 'Obra' })).data;
    await request(t.http)
      .patch(api(`/projects/${project.id}`))
      .set('Authorization', a.auth)
      .send({ clientId: foreign.id })
      .expect(404);
  });

  it('returns 404 for another tenant’s project', async () => {
    const client = (await post(a, '/clients', { name: 'Cliente A' })).data;
    const project = (await post(a, '/projects', { clientId: client.id, name: 'Obra A' })).data;

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

  it('validates input', async () => {
    const res = await post(a, '/projects', { clientId: 'nope', name: '' }, 400);
    expect(res.error.details).toEqual(
      expect.arrayContaining(['clientId must be a UUID', 'name should not be empty']),
    );
    await request(t.http)
      .get(api('/projects?clientId=nope'))
      .set('Authorization', a.auth)
      .expect(400);
  });
});
