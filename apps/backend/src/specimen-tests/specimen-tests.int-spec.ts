import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

describe('tests (integration)', () => {
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

  it('lists the planned tests with derived dates, overdue first', async () => {
    await completedRecord(a, projectId, '2026-09-02');
    const res = await as(a).get('/tests/pending?until=2026-12-31').expect(200);
    const items = res.body.data as {
      scheduledDate: string;
      dueStatus: string;
      specimen: { specimenNumber: number };
      fieldRecord: { registryNumber: string };
      project: { code: string };
    }[];
    expect(items.map((i) => [i.specimen.specimenNumber, i.scheduledDate])).toEqual([
      [405, '2026-09-05'],
      [406, '2026-09-05'],
      [407, '2026-09-09'],
      [408, '2026-09-09'],
    ]);
    expect(items[0]).toMatchObject({
      dueStatus: 'OVERDUE',
      fieldRecord: { registryNumber: 'MCH-068' },
      project: { code: 'PVLT' },
    });

    const early = await as(a).get('/tests/pending?until=2026-09-06').expect(200);
    expect(early.body.data).toHaveLength(2);
  });

  it('applies the lab holidays and filters by project', async () => {
    await as(a).post('/holidays', { date: '2026-09-09', name: 'Prueba' }).expect(201);
    await completedRecord(a, projectId, '2026-09-02');
    const res = await as(a).get(`/tests/pending?until=2026-12-31&projectId=${projectId}`);
    const dates = (res.body.data as { scheduledDate: string }[]).map((i) => i.scheduledDate);
    expect(dates).toEqual(['2026-09-05', '2026-09-05', '2026-09-10', '2026-09-10']);

    const other = await as(a)
      .get('/tests/pending?until=2026-12-31&projectId=00000000-0000-4000-8000-000000000000')
      .expect(200);
    expect(other.body.data).toEqual([]);
  });

  it('shows nothing from another lab and validates the query', async () => {
    await completedRecord(a, projectId, '2026-09-02');
    const res = await as(b).get('/tests/pending?until=2026-12-31').expect(200);
    expect(res.body.data).toEqual([]);
    await as(a).get('/tests/pending?until=2026-13-01').expect(400);
    await as(a).get('/tests/pending?projectId=nope').expect(400);
  });

  it('reschedules a test until it is done (Q-22) and keeps exact dates (Q-21)', async () => {
    await completedRecord(a, projectId, '2026-09-03');
    const list = await as(a).get('/tests/pending?until=2026-12-31');
    const first = (list.body.data as { id: string; scheduledDate: string }[])[0];
    // 2026-09-03 + 3 = Sunday 09-06, tested Monday 09-07.
    expect(first.scheduledDate).toBe('2026-09-07');

    const patch = (who: TenantFixture, body: object) =>
      request(t.http)
        .patch(api('/tests/' + first.id + '/schedule'))
        .set('Authorization', who.auth)
        .send(body);
    await patch(a, { keepExactDate: true }).expect(200);
    await patch(a, { ageDays: 14 }).expect(200);
    const after = await as(a).get('/tests/pending?until=2026-12-31');
    const moved = (
      after.body.data as { id: string; ageDays: number; scheduledDate: string }[]
    ).find((i) => i.id === first.id);
    expect(moved).toMatchObject({ ageDays: 14, scheduledDate: '2026-09-17' });

    await patch(b, { ageDays: 7 }).expect(404);
    await patch(a, { ageDays: 0 }).expect(400);
  });

  it('cancels a damaged specimen and its open test (5.4)', async () => {
    const recordId = await completedRecord(a, projectId, '2026-09-02');
    const record = await as(a).get('/field-records/' + recordId);
    const specimens = record.body.data.deliveries[0].samples[0].specimens as { id: string }[];
    const specimenId = specimens[0].id;

    await as(b)
      .post('/specimens/' + specimenId + '/cancel', {})
      .expect(404);
    const res = await as(a)
      .post('/specimens/' + specimenId + '/cancel', {})
      .expect(200);
    expect(res.body.data.deliveries[0].samples[0].specimens[0]).toMatchObject({
      status: 'CANCELLED',
      test: null,
    });

    const pending = await as(a).get('/tests/pending?until=2026-12-31');
    expect(pending.body.data).toHaveLength(3);
    await as(a)
      .post('/specimens/' + specimenId + '/cancel', {})
      .expect(409);
    await expect(t.prisma.specimenTest.count({ where: { status: 'CANCELLED' } })).resolves.toBe(1);
  });

  it('records a worksheet (FPC06-01) and derives the results (7.3, 7.4)', async () => {
    await completedRecord(a, projectId, '2026-09-02');
    const sheetUrl = `/tests/worksheet?projectId=${projectId}&testDate=2026-09-05`;
    const sheet = await as(a).get(sheetUrl).expect(200);
    const rows = sheet.body.data.groups[0].rows as {
      id: string;
      specimen: { specimenNumber: number };
    }[];
    expect(sheet.body.data.groups[0].fieldRecord.registryNumber).toBe('MCH-068');
    expect(rows.map((r) => r.specimen.specimenNumber)).toEqual([405, 406]);

    const reading = {
      height1Cm: 29.7,
      height2Cm: 29.8,
      diameter1Cm: 14.9,
      diameter2Cm: 14.9,
      maxLoadKgf: 36470,
    };
    const body = {
      testDate: '2026-09-05',
      pressCode: 'CCP-PRE-05',
      rows: [{ testId: rows[0].id, testTime: '10:00', failureType: 3, ...reading }],
    };
    await as(b).put('/tests/results', body).expect(404);
    await as(a)
      .put('/tests/results', { ...body, testDate: '2026-09-01' })
      .expect(400);
    await as(a)
      .put('/tests/results', { ...body, rows: [{ ...body.rows[0], failureType: 7 }] })
      .expect(400);
    await as(a).put('/tests/results', body).expect(200);

    const after = await as(a).get(sheetUrl).expect(200);
    const [r405, r406] = after.body.data.groups[0].rows;
    expect(r405).toMatchObject({
      status: 'COMPLETED',
      testTime: '10:00',
      readings: { maxLoadKgf: 36470, failureType: 3 },
      result: { areaCm2: 174.4, stressKgCm2: 209, percentOfDesign: 83.6, maxLoadN: 357771 },
      ageTolerance: { status: 'WITHIN' },
    });
    expect(r406.result).toBeNull();
    expect(after.body.data.pressCode).toBe('CCP-PRE-05');

    // Tested: off the pending list; corrections are saved again (A-85).
    const pending = await as(a).get('/tests/pending?until=2026-12-31');
    expect(pending.body.data).toHaveLength(3);
    await as(a)
      .put('/tests/results', { ...body, rows: [{ ...body.rows[0], maxLoadKgf: 37000 }] })
      .expect(200);
    const corrected = await as(a).get(sheetUrl);
    expect(corrected.body.data.groups[0].rows[0].result.stressKgCm2).toBe(212);

    await as(b).get(sheetUrl).expect(404);
    await as(a).get(`/tests/worksheet?projectId=${projectId}&testDate=nope`).expect(400);
  });
});
