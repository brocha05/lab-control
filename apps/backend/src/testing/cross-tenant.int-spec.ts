import request from 'supertest';
import { createTwoTenants, type TenantFixture } from './fixtures.js';
import { createTestApp, truncateAll, type TestApp } from './test-app.js';

describe('cross-tenant isolation, every endpoint (integration, 10.3)', () => {
  let t: TestApp;
  let a: TenantFixture;
  let b: TenantFixture;
  let projectId: string;

  const api = (path: string) => `/api/v1${path}`;
  const as = (who: TenantFixture) => ({
    get: (path: string) => request(t.http).get(api(path)).set('Authorization', who.auth),
    post: (path: string, body: object) =>
      request(t.http).post(api(path)).set('Authorization', who.auth).send(body),
    put: (path: string, body: object) =>
      request(t.http).put(api(path)).set('Authorization', who.auth).send(body),
    patch: (path: string, body: object) =>
      request(t.http).patch(api(path)).set('Authorization', who.auth).send(body),
  });
  const idOf = (res: request.Response) => (res.body.data as { id: string }).id;

  /** A completed MCH-068-like record: one sample, specimens 405–408. */
  async function completedRecord(who: TenantFixture, project: string, pourDate: string) {
    const supplierId = idOf(await as(who).post('/catalogs/suppliers', { name: `S-${pourDate}` }));
    const cementTypeId = idOf(
      await as(who).post('/catalogs/cement-types', { name: `C-${pourDate}` }),
    );
    const id = idOf(await as(who).post(`/projects/${project}/field-records`, { pourDate }));
    const delivery = {
      ticketNumber: '1',
      volumeM3: 7,
      plantDepartureTime: '08:36',
      siteArrivalTime: '10:15',
      pourStartTime: '10:25',
      pourEndTime: '10:56',
      ambientTemperatureC: 32,
      concreteTemperatureC: 34,
      slump1Cm: 15,
      samples: [
        {
          sampleNumber: 102,
          moldedAt: '10:30',
          specimens: [405, 406, 407, 408].map((n) => ({ specimenNumber: n, moldCode: `M${n}` })),
        },
      ],
    };
    await as(who)
      .put(`/field-records/${id}`, {
        registrySequence: 68,
        pourDate,
        supplierId,
        cementTypeId,
        strengthCriterion: 'FC',
        specifiedStrengthKgCm2: 250,
        specifiedSlumpCm: 14,
        specifiedSlumpToleranceCm: 3.5,
        maxAggregateSizeMm: 20,
        designAgeDays: 7,
        screened: false,
        skyCondition: 'CLOUDY',
        windCondition: 'CALM',
        lightingCondition: 'NATURAL',
        slumpConeCode: 'CR-02',
        tapeMeasureCode: 'FLX-01',
        strikeOffBarCode: 'EM-10',
        slumpRodCode: '03',
        samplingRodCode: '03',
        wheelbarrowCode: '03',
        programmedElement: 'Muro',
        castElement: 'Muro adicional',
        samplerName: 'Tec.',
        approvedByName: 'Cliente',
        deliveries: [delivery],
      })
      .expect(200);
    await as(who).post(`/field-records/${id}/complete`, {}).expect(200);
    return id;
  }

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.app.close();
  });
  beforeEach(async () => {
    await truncateAll(t.prisma);
    ({ a, b } = await createTwoTenants(t.prisma, t.http));
    const client = idOf(await as(a).post('/clients', { name: 'MARECOMSA', code: 'MAR' }));
    projectId = idOf(
      await as(a).post('/projects', { clientId: client, name: 'Las Tunas', code: 'PVLT' }),
    );
    await as(a)
      .put(`/projects/${projectId}/test-configuration`, {
        ages: [
          { ageDays: 3, specimenCount: 2 },
          { ageDays: 7, specimenCount: 2 },
        ],
      })
      .expect(200);
  });

  it("returns 404 for every route that takes another lab's id", async () => {
    const recordId = await completedRecord(a, projectId, '2026-09-02');
    const record = await as(a).get(`/field-records/${recordId}`).expect(200);
    const specimen = record.body.data.deliveries[0].samples[0].specimens[0] as {
      id: string;
      test: { id: string };
    };
    const clientId = (await as(a).get(`/projects/${projectId}`)).body.data.client.id as string;
    const supplierId = (await as(a).post('/catalogs/suppliers', { name: 'X' })).body.data
      .id as string;
    const cementId = (await as(a).post('/catalogs/cement-types', { name: 'Y' })).body.data
      .id as string;
    const holidayId = (await as(a).post('/holidays', { date: '2026-12-12', name: 'Z' })).body.data
      .id as string;
    const userId = a.userId;
    const reportId = (await as(a).post(`/field-records/${recordId}/reports`, {})).body.data
      .id as string;

    const asB = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, body = {}) =>
      request(t.http)[method](api(path)).set('Authorization', b.auth).send(body);

    const routes: [string, string, object?][] = [
      ['get', `/clients/${clientId}`],
      ['patch', `/clients/${clientId}`, { contactName: 'x' }],
      ['get', `/projects/${projectId}`],
      ['patch', `/projects/${projectId}`, { location: 'x' }],
      ['get', `/projects/${projectId}/test-configuration`],
      [
        'put',
        `/projects/${projectId}/test-configuration`,
        { ages: [{ ageDays: 7, specimenCount: 2 }] },
      ],
      ['get', `/projects/${projectId}/field-records`],
      ['get', `/projects/${projectId}/field-records/next-numbers`],
      ['post', `/projects/${projectId}/field-records`, { pourDate: '2026-09-10' }],
      ['get', `/projects/${projectId}/bitacora`],
      ['get', `/bitacora/export?projectId=${projectId}`],
      ['get', `/tests/worksheet?projectId=${projectId}&testDate=2026-09-05`],
      ['get', `/field-records/${recordId}`],
      ['put', `/field-records/${recordId}`, { pourDate: '2026-09-02', frontNumber: 1 }],
      ['post', `/field-records/${recordId}/complete`],
      ['post', `/field-records/${recordId}/cancel`],
      ['post', `/specimens/${specimen.id}/cancel`],
      ['patch', `/tests/${specimen.test.id}/schedule`, { ageDays: 14 }],
      [
        'put',
        '/tests/results',
        {
          testDate: '2026-09-05',
          rows: [
            {
              testId: specimen.test.id,
              height1Cm: 30,
              height2Cm: 30,
              diameter1Cm: 15,
              diameter2Cm: 15,
              maxLoadKgf: 40000,
            },
          ],
        },
      ],
      ['get', `/field-records/${recordId}/reports`],
      ['patch', `/reports/${reportId}`, { observations: 'x' }],
      ['post', `/reports/${reportId}/generate`],
      ['post', `/reports/${reportId}/finalize`],
      ['get', `/reports/${reportId}/pdf`],
      ['post', `/field-records/${recordId}/reports`],
      ['patch', `/catalogs/suppliers/${supplierId}`, { name: 'Robado' }],
      ['patch', `/catalogs/cement-types/${cementId}`, { name: 'Robado' }],
      ['delete', `/holidays/${holidayId}`],
      ['patch', `/users/${userId}`, { fullName: 'Robado' }],
      ['post', `/users/${userId}/password`, { password: 'robado-12345' }],
    ];

    const leaks: string[] = [];
    for (const [method, path, body] of routes) {
      const res = await asB(method as 'get', path, body);
      // The nested PUT validates its full body before looking the record up: a 400 reveals
      // nothing about another lab's data.
      const ok =
        res.status === 404 ||
        (method === 'put' && path.startsWith('/field-records/') && res.status === 400);
      if (!ok) leaks.push(`${method.toUpperCase()} ${path} → ${res.status}`);
    }
    expect(leaks).toEqual([]);

    // Filters over another lab's ids return nothing (lists, not resources).
    const audit = await asB('get', `/audit-events?entityId=${recordId}`).expect(200);
    expect(audit.body.data).toEqual([]);
    const reports = await asB('get', `/reports?projectId=${projectId}`).expect(200);
    expect(reports.body.data).toEqual([]);
    const pending = await asB(
      'get',
      `/tests/pending?until=2026-12-31&projectId=${projectId}`,
    ).expect(200);
    expect(pending.body.data).toEqual([]);

    // Tenant A's data is untouched.
    const after = await as(a).get(`/field-records/${recordId}`).expect(200);
    expect(after.body.data.status).toBe('COMPLETED');
    const suppliers = (await as(a).get('/catalogs/suppliers')).body.data as { name: string }[];
    expect(suppliers.map((x) => x.name)).toContain('X');
  });
});
