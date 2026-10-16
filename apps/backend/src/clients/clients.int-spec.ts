import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('clients (integration)', () => {
  let t: TestApp;
  let a: TenantFixture;
  let b: TenantFixture;

  const api = (path: string) => `/api/v1${path}`;
  const names = (res: request.Response) =>
    (res.body.data.items as { name: string }[]).map((c) => c.name);
  const createClient = async (who: TenantFixture, body: object) =>
    (
      await request(t.http)
        .post(api('/clients'))
        .set('Authorization', who.auth)
        .send(body)
        .expect(201)
    ).body.data as { id: string; name: string };

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

  it('creates, reads and updates a client', async () => {
    const created = await createClient(a, {
      name: '  MARECOMSA S.A. DE C.V. ',
      code: ' mar ',
      contactName: 'Ing. Jorge Valenzuela',
      contactPhone: '312 000 0000',
    });
    expect(created).toMatchObject({
      name: 'MARECOMSA S.A. DE C.V.',
      code: 'MAR',
      contactName: 'Ing. Jorge Valenzuela',
      contactPhone: '312 000 0000',
    });

    const got = await request(t.http)
      .get(api(`/clients/${created.id}`))
      .set('Authorization', a.auth)
      .expect(200);
    expect(got.body.data.id).toBe(created.id);

    const updated = await request(t.http)
      .patch(api(`/clients/${created.id}`))
      .set('Authorization', a.auth)
      .send({ contactPhone: '', contactName: null })
      .expect(200);
    expect(updated.body.data).toMatchObject({
      name: 'MARECOMSA S.A. DE C.V.',
      contactName: null,
      contactPhone: null,
    });
  });

  it('lists only the tenant’s clients, sorted, paginated and searchable', async () => {
    for (const [name, code] of [
      ['Zeta Constructora', 'ZET'],
      ['Alfa Obras', 'ALF'],
      ['Marecomsa', 'MAR'],
    ]) {
      await createClient(a, { name, code });
    }
    await createClient(b, { name: 'Alfa de otro laboratorio', code: 'ALF' });

    const page1 = await request(t.http)
      .get(api('/clients?limit=2'))
      .set('Authorization', a.auth)
      .expect(200);
    expect(page1.body.data).toMatchObject({ total: 3, page: 1, limit: 2, pages: 2 });
    expect(names(page1)).toEqual(['Alfa Obras', 'Marecomsa']);

    const search = await request(t.http)
      .get(api('/clients?q=ALFA'))
      .set('Authorization', a.auth)
      .expect(200);
    expect(names(search)).toEqual(['Alfa Obras']);
  });

  it('validates input and rejects unknown fields (incl. tenantId)', async () => {
    const res = await request(t.http)
      .post(api('/clients'))
      .set('Authorization', a.auth)
      .send({ name: '   ', tenantId: b.tenantId })
      .expect(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining(['property tenantId should not exist', 'name should not be empty']),
    );
    await request(t.http).get(api('/clients?limit=500')).set('Authorization', a.auth).expect(400);
    await request(t.http).get(api('/clients/not-a-uuid')).set('Authorization', a.auth).expect(400);
  });

  it('returns 404 for another tenant’s client, on read and on update', async () => {
    const foreign = await createClient(a, { name: 'Cliente de A', code: 'CDA' });

    await request(t.http)
      .get(api(`/clients/${foreign.id}`))
      .set('Authorization', b.auth)
      .expect(404);
    await request(t.http)
      .patch(api(`/clients/${foreign.id}`))
      .set('Authorization', b.auth)
      .send({ name: 'Secuestrado' })
      .expect(404);

    const still = await request(t.http)
      .get(api(`/clients/${foreign.id}`))
      .set('Authorization', a.auth)
      .expect(200);
    expect(still.body.data.name).toBe('Cliente de A');
  });

  it('requires a 3–4 letter code, unique per lab (409), reusable in another lab', async () => {
    const bad = await request(t.http)
      .post(api('/clients'))
      .set('Authorization', a.auth)
      .send({ name: 'Sin clave' })
      .expect(400);
    expect(bad.body.error.details).toContain('code must be 3 or 4 letters');
    for (const code of ['MA', 'MAREC', 'M4R']) {
      await request(t.http)
        .post(api('/clients'))
        .set('Authorization', a.auth)
        .send({ name: 'X', code })
        .expect(400);
    }

    const first = await createClient(a, { name: 'Marecomsa', code: 'MAR' });
    const dup = await request(t.http)
      .post(api('/clients'))
      .set('Authorization', a.auth)
      .send({ name: 'Otro', code: 'mar' })
      .expect(409);
    expect(dup.body.error.code).toBe('CONFLICT');

    const other = await createClient(a, { name: 'Otro', code: 'OTR' });
    await request(t.http)
      .patch(api(`/clients/${other.id}`))
      .set('Authorization', a.auth)
      .send({ code: 'MAR' })
      .expect(409);

    await createClient(b, { name: 'Marecomsa en B', code: 'MAR' });
    expect(first.id).toBeDefined();
  });

  it('searches by code too', async () => {
    await createClient(a, { name: 'Marecomsa S.A. de C.V.', code: 'MAR' });
    await createClient(a, { name: 'Constructora Tunas', code: 'CTU' });
    const res = await request(t.http)
      .get(api('/clients?q=ctu'))
      .set('Authorization', a.auth)
      .expect(200);
    expect(names(res)).toEqual(['Constructora Tunas']);
  });

  it('requires authentication', async () => {
    await request(t.http).get(api('/clients')).expect(401);
  });
});
