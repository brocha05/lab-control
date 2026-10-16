import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('reports (integration)', () => {
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

  const readings = (testId: string) => ({
    testId,
    testTime: '10:00',
    height1Cm: 29.7,
    height2Cm: 29.8,
    diameter1Cm: 14.9,
    diameter2Cm: 14.9,
    maxLoadKgf: 36470,
  });

  async function testAll(projectIdArg: string) {
    for (const testDate of ['2026-09-05', '2026-09-09']) {
      const sheet = await as(a).get(
        `/tests/worksheet?projectId=${projectIdArg}&testDate=${testDate}`,
      );
      const rows = (sheet.body.data.groups[0].rows as { id: string; status: string }[]).filter(
        (r) => r.status !== 'COMPLETED',
      );
      await as(a)
        .put('/tests/results', { testDate, rows: rows.map((r) => readings(r.id)) })
        .expect(200);
    }
  }

  it('creates, generates and finalizes a versioned report (9.3, 9.4)', async () => {
    const recordId = await completedRecord(a, projectId, '2026-09-02');

    const before = await as(a).get(`/field-records/${recordId}/reports`).expect(200);
    expect(before.body.data.missing).toContain('specimens[405].test');

    const created = await as(a)
      .post(`/field-records/${recordId}/reports`, { mixingEquipment: 'CAMIÓN MEZCLADOR' })
      .expect(201);
    const id = created.body.data.id as string;
    expect(created.body.data).toMatchObject({ version: 1, status: 'DRAFT', hasPdf: false });
    await as(a).post(`/field-records/${recordId}/reports`, {}).expect(409);
    await as(a).post(`/reports/${id}/generate`, {}).expect(422);

    await testAll(projectId);
    const generated = await as(a).post(`/reports/${id}/generate`, {}).expect(201);
    expect(generated.body.data).toMatchObject({
      status: 'GENERATED',
      reportNumber: 'MAR-PVLT-F1-CTO-REC-068',
      hasPdf: true,
    });
    expect(generated.body.data.contentSha256).toMatch(/^[0-9a-f]{64}$/);
    const stored = await t.prisma.report.findUniqueOrThrow({ where: { id } });
    expect(stored.snapshot).toMatchObject({
      reportNumber: 'MAR-PVLT-F1-CTO-REC-068',
      pages: [
        { sampleNumber: 102, specimens: [{ specimenNumber: 405, stressKgCm2: 209 }, {}, {}, {}] },
      ],
      fields: { mixingEquipment: 'CAMIÓN MEZCLADOR' },
    });

    const pdf = await as(a).get(`/reports/${id}/pdf`).expect(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    await as(b).get(`/reports/${id}/pdf`).expect(404);
    await as(b).post(`/reports/${id}/finalize`, {}).expect(404);

    const final = await as(a).post(`/reports/${id}/finalize`, {}).expect(201);
    expect(final.body.data.status).toBe('FINAL');
    await as(a).patch(`/reports/${id}`, { observations: 'x' }).expect(409);
    await as(a).post(`/reports/${id}/generate`, {}).expect(409);

    // Correction: new version, same number; finalizing it supersedes v1 (Q-36).
    const v2 = await as(a).post(`/field-records/${recordId}/reports`, {}).expect(201);
    expect(v2.body.data).toMatchObject({
      version: 2,
      reportNumber: 'MAR-PVLT-F1-CTO-REC-068',
      mixingEquipment: 'CAMIÓN MEZCLADOR',
    });
    const v2id = v2.body.data.id as string;
    await as(a).patch(`/reports/${v2id}`, { observations: 'Corrige tipo de falla' }).expect(200);
    await as(a).post(`/reports/${v2id}/generate`, {}).expect(201);
    await as(a).post(`/reports/${v2id}/finalize`, {}).expect(201);
    const list = await as(a).get(`/field-records/${recordId}/reports`).expect(200);
    const [r2, r1] = list.body.data.reports as { version: number; supersededAt: string | null }[];
    expect([r2.version, r1.version]).toEqual([2, 1]);
    expect(r2.supersededAt).toBeNull();
    expect(r1.supersededAt).not.toBeNull();

    const all = await as(a).get(`/reports?projectId=${projectId}`).expect(200);
    expect(all.body.data).toHaveLength(2);
    expect((await as(b).get('/reports').expect(200)).body.data).toEqual([]);
  });

  it('lets only the Jefe de Control de Calidad finalize (Q-40)', async () => {
    const recordId = await completedRecord(a, projectId, '2026-09-02');
    await testAll(projectId);
    const id = (await as(a).post(`/field-records/${recordId}/reports`, {})).body.data.id as string;
    await as(a).post(`/reports/${id}/generate`, {}).expect(201);

    await t.prisma.user.update({ where: { id: a.userId }, data: { role: 'LAB_MANAGER' } });
    const login = await request(t.http)
      .post('/api/v1/auth/login')
      .send({ email: a.email, password: a.password })
      .expect(200);
    const labManager = `Bearer ${login.body.data.tokens.accessToken as string}`;
    await request(t.http)
      .post(api(`/reports/${id}/finalize`))
      .set('Authorization', labManager)
      .expect(403);
  });
});
