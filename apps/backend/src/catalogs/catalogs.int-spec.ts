import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('catalogs and holidays (integration)', () => {
  let t: TestApp;
  let a: TenantFixture;
  let b: TenantFixture;
  const api = (path: string) => `/api/v1${path}`;

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

  describe.each(['/catalogs/suppliers', '/catalogs/cement-types'])('%s', (path) => {
    it('adds entries, lists them sorted, and renames', async () => {
      for (const name of ['  CEMEX ', 'Apasco']) {
        await request(t.http)
          .post(api(path))
          .set('Authorization', a.auth)
          .send({ name })
          .expect(201);
      }
      const list = await request(t.http).get(api(path)).set('Authorization', a.auth).expect(200);
      expect((list.body.data as { name: string }[]).map((e) => e.name)).toEqual([
        'Apasco',
        'CEMEX',
      ]);

      const id = (list.body.data as { id: string }[])[0].id;
      const renamed = await request(t.http)
        .patch(api(`${path}/${id}`))
        .set('Authorization', a.auth)
        .send({ name: 'Holcim Apasco' })
        .expect(200);
      expect(renamed.body.data).toEqual({ id, name: 'Holcim Apasco' });
    });

    it('rejects a duplicate name, ignoring case (409), but not in another lab', async () => {
      await request(t.http).post(api(path)).set('Authorization', a.auth).send({ name: 'CEMEX' });
      await request(t.http)
        .post(api(path))
        .set('Authorization', a.auth)
        .send({ name: 'cemex' })
        .expect(409);
      await request(t.http)
        .post(api(path))
        .set('Authorization', b.auth)
        .send({ name: 'CEMEX' })
        .expect(201);
    });

    it('keeps labs apart: list and rename across tenants', async () => {
      const created = await request(t.http)
        .post(api(path))
        .set('Authorization', a.auth)
        .send({ name: 'CEMEX' });
      const id = (created.body.data as { id: string }).id;

      const listB = await request(t.http).get(api(path)).set('Authorization', b.auth);
      expect(listB.body.data).toEqual([]);
      await request(t.http)
        .patch(api(`${path}/${id}`))
        .set('Authorization', b.auth)
        .send({ name: 'X' })
        .expect(404);
    });
  });

  describe('/holidays', () => {
    it('adds holidays, lists them by year, rejects duplicates and removes', async () => {
      const add = (date: string, name: string, who = a) =>
        request(t.http).post(api('/holidays')).set('Authorization', who.auth).send({ date, name });

      await add('2026-09-16', 'Día de la Independencia').expect(201);
      await add('2026-11-16', 'Revolución Mexicana').expect(201);
      await add('2027-01-01', 'Año Nuevo').expect(201);
      await add('2026-09-16', 'Otra vez').expect(409);
      await add('2026-02-30', 'Inexistente').expect(400);

      const list = await request(t.http)
        .get(api('/holidays?year=2026'))
        .set('Authorization', a.auth)
        .expect(200);
      const items = list.body.data as { id: string; date: string }[];
      expect(items.map((h) => h.date)).toEqual(['2026-09-16', '2026-11-16']);

      await request(t.http)
        .delete(api(`/holidays/${items[0].id}`))
        .set('Authorization', b.auth)
        .expect(404);
      await request(t.http)
        .delete(api(`/holidays/${items[0].id}`))
        .set('Authorization', a.auth)
        .expect(204);

      const listB = await request(t.http)
        .get(api('/holidays?year=2026'))
        .set('Authorization', b.auth);
      expect(listB.body.data).toEqual([]);
    });

    it('requires a year', async () => {
      await request(t.http).get(api('/holidays')).set('Authorization', a.auth).expect(400);
    });
  });
});
