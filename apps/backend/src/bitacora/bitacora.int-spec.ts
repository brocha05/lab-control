import ExcelJS from 'exceljs';
import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('bitacora (integration)', () => {
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

  it('lists completed records, one row per specimen, with results (8.1)', async () => {
    await completedRecord(a, projectId, '2026-09-02');
    // A draft is not in the log (A-93).
    await as(a)
      .post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-03' })
      .expect(201);

    const sheet = await as(a).get(`/tests/worksheet?projectId=${projectId}&testDate=2026-09-05`);
    const first = sheet.body.data.groups[0].rows[0] as { id: string };
    await as(a)
      .put('/tests/results', {
        testDate: '2026-09-05',
        rows: [
          {
            testId: first.id,
            height1Cm: 29.7,
            height2Cm: 29.8,
            diameter1Cm: 14.9,
            diameter2Cm: 14.9,
            maxLoadKgf: 36470,
          },
        ],
      })
      .expect(200);

    const res = await as(a).get(`/projects/${projectId}/bitacora`).expect(200);
    const data = res.body.data;
    expect(data.summary).toEqual({ records: 1, samples: 1, specimens: 4, tested: 1 });
    const record = data.records[0];
    expect(record).toMatchObject({
      registryNumber: 'MCH-068',
      supplier: 'S-2026-09-02',
      production: null,
      maxAggregateSizeCm: 2,
    });
    expect(record.samples[0]).toMatchObject({ sampleNumber: 102, slump1Cm: 15, moldedAt: '10:30' });
    expect(record.samples[0].specimens[0]).toMatchObject({
      specimenNumber: 405,
      tested: true,
      areaCm2: 174.4,
      stressKgCm2: 209,
      percentOfDesign: 83.6,
    });
    expect(record.samples[0].specimens[2]).toMatchObject({ tested: false, date: '2026-09-09' });

    const later = await as(a).get(`/projects/${projectId}/bitacora?from=2026-09-03`).expect(200);
    expect(later.body.data.records).toEqual([]);
    await as(a).get(`/projects/${projectId}/bitacora?from=nope`).expect(400);
    await as(b).get(`/projects/${projectId}/bitacora`).expect(404);
  });

  it('exports an Excel workbook with a tab per project (8.3)', async () => {
    await completedRecord(a, projectId, '2026-09-02');
    const res = await as(a)
      .get('/bitacora/export')
      .buffer(true)
      .parse((r, done) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body as never);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['PVLT Las Tunas']);
    const ws = wb.worksheets[0];
    expect(ws.getCell(5, 1).value).toBe('MCH-068');
    expect(ws.getCell(5, 16).value).toBe(405);
    expect(ws.getCell(8, 16).value).toBe(408);

    await as(b).get(`/bitacora/export?projectId=${projectId}`).expect(404);
  });
});
