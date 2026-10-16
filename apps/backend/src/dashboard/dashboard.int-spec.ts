import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('dashboard summary (integration, 8.4)', () => {
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

  it("counts the lab's clients, projects, tests, drafts and pending reports", async () => {
    // Poured in September: its 3- and 7-day tests are overdue by now.
    const recordId = await completedRecord(a, projectId, '2026-09-02');
    await as(a).post(`/field-records/${recordId}/reports`, {}).expect(201);
    await as(a)
      .post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-10' })
      .expect(201);

    const res = await as(a).get('/dashboard/summary').expect(200);
    expect(res.body.data).toMatchObject({
      clients: 1,
      projects: 1,
      tests: {
        overdue: 4,
        dueToday: 0,
        upcoming: 0,
        byProject: [{ projectId, count: 4 }],
      },
      draftFieldRecords: 1,
      pendingReports: 1,
    });
    expect(res.body.data.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Another lab sees only its own (empty) counts.
    expect((await as(b).get('/dashboard/summary').expect(200)).body.data).toMatchObject({
      clients: 0,
      projects: 0,
      tests: { overdue: 0, dueToday: 0, upcoming: 0, byProject: [] },
      draftFieldRecords: 0,
      pendingReports: 0,
    });
  });

  it('is readable by read-only roles', async () => {
    await t.prisma.user.update({ where: { id: a.userId }, data: { role: 'FIELD_CREW_CHIEF' } });
    await as(a).get('/dashboard/summary').expect(200);
  });
});
