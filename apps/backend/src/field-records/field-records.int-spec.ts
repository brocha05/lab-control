import request from 'supertest';
import { createTwoTenants, type TenantFixture } from '../testing/fixtures.js';
import { createTestApp, truncateAll, type TestApp } from '../testing/test-app.js';

/** The real FPC01-01 of registro MCH-068 (docs/domain/analysis/FPC01-01.md). */
function mch068Form(ids: { supplierId: string; cementTypeId: string }) {
  const truck = (
    ticket: string,
    volume: number,
    times: string[],
    temps: number[],
    slump: number,
  ) => ({
    ticketNumber: ticket,
    volumeM3: volume,
    plantDepartureTime: times[0],
    siteArrivalTime: times[1],
    pourStartTime: times[2],
    pourEndTime: times[3],
    ambientTemperatureC: temps[0],
    concreteTemperatureC: temps[1],
    slump1Cm: slump,
    slump2Cm: null,
    samples: [] as object[],
  });
  const deliveries = [
    truck('284174007', 7, ['08:36', '10:15', '10:25', '10:56'], [32, 34], 15),
    truck('284174325', 7, ['08:58', '10:44', '11:09', '11:25'], [32, 34], 16),
    truck('284174881', 7, ['09:21', '11:11', '11:30', '11:55'], [33, 34], 16),
    truck('284175435', 4, ['09:44', '11:17', '11:59', '12:10'], [33, 34], 15),
  ];
  deliveries[0].samples = [
    {
      sampleNumber: 102,
      specimenType: 'CYLINDER_15X30',
      moldedAt: '10:30',
      specimens: [
        { specimenNumber: 405, moldCode: '020' },
        { specimenNumber: 406, moldCode: '092' },
        { specimenNumber: 407, moldCode: '022' },
        { specimenNumber: 408, moldCode: '094' },
      ],
    },
  ];
  return {
    registrySequence: 68,
    frontNumber: 1,
    pourDate: '2026-09-02',
    supplierId: ids.supplierId,
    production: 'READY_MIXED',
    strengthCriterion: 'FC',
    specifiedStrengthKgCm2: 250,
    specifiedSlumpCm: 14,
    specifiedSlumpToleranceCm: 3.5,
    maxAggregateSizeMm: 20,
    cementTypeId: ids.cementTypeId,
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
    programmedElement: 'Muro adicional lado izq., 1ra sección',
    castElement: 'MURO ADICIONAL (PRIMERA SECCIÓN LADO IZQUIERDO)',
    samplerName: 'Tec. Antonio Torres R.',
    approvedByName: 'Cliente',
    deliveries,
  };
}

describe('field records (integration)', () => {
  let t: TestApp;
  let a: TenantFixture;
  let b: TenantFixture;
  let projectId: string;
  let catalog: { supplierId: string; cementTypeId: string };

  const api = (path: string) => `/api/v1${path}`;
  const as = (who: TenantFixture) => ({
    get: (path: string) => request(t.http).get(api(path)).set('Authorization', who.auth),
    post: (path: string, body: object) =>
      request(t.http).post(api(path)).set('Authorization', who.auth).send(body),
    put: (path: string, body: object) =>
      request(t.http).put(api(path)).set('Authorization', who.auth).send(body),
  });
  const idOf = (res: request.Response) => (res.body.data as { id: string }).id;

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
      await as(a).post('/projects', { clientId: client, name: 'Puente Las Tunas', code: 'PVLT' }),
    );
    catalog = {
      supplierId: idOf(await as(a).post('/catalogs/suppliers', { name: 'CEMEX' })),
      cementTypeId: idOf(await as(a).post('/catalogs/cement-types', { name: 'CPC-40' })),
    };
  });

  it('creates DRAFTs with consecutive registro numbers per project (Q-55)', async () => {
    const first = await as(a).post(`/projects/${projectId}/field-records`, {
      pourDate: '2026-09-02',
    });
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({
      status: 'DRAFT',
      registrySequence: 1,
      registryNumber: 'MCH-001',
      frontNumber: 1,
      pourDate: '2026-09-02',
      project: { id: projectId, code: 'PVLT', client: { name: 'MARECOMSA' } },
      deliveries: [],
      sheetCount: 1,
    });

    const second = await as(a).post(`/projects/${projectId}/field-records`, {
      pourDate: '2026-09-03',
    });
    expect(second.body.data.registryNumber).toBe('MCH-002');

    await as(a)
      .post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-04', registrySequence: 2 })
      .expect(409);
    await as(a)
      .post(`/projects/${projectId}/field-records`, { pourDate: '2026-02-30' })
      .expect(400);
  });

  it('saves and reads back the whole MCH-068 form', async () => {
    const id = idOf(
      await as(a).post(`/projects/${projectId}/field-records`, {
        pourDate: '2026-09-02',
        registrySequence: 68,
      }),
    );
    const saved = await as(a).put(`/field-records/${id}`, mch068Form(catalog)).expect(200);
    const record = saved.body.data;

    expect(record).toMatchObject({
      registryNumber: 'MCH-068',
      supplier: { name: 'CEMEX' },
      cementType: { name: 'CPC-40' },
      specifiedStrengthKgCm2: 250,
      specifiedSlumpToleranceCm: 3.5,
      skyCondition: 'CLOUDY',
      sheetCount: 1,
    });
    const deliveries = record.deliveries as { sequence: number; cumulativeVolumeM3: number }[];
    expect(deliveries.map((d) => d.sequence)).toEqual([1, 2, 3, 4]);
    expect(deliveries.map((d) => d.cumulativeVolumeM3)).toEqual([7, 14, 21, 25]);
    expect(record.deliveries[0]).toMatchObject({
      ticketNumber: '284174007',
      plantDepartureTime: '08:36',
      concreteTemperatureC: 34,
      slump1Cm: 15,
      slump2Cm: null,
      samples: [
        {
          sampleNumber: 102,
          specimenType: 'CYLINDER_15X30',
          moldedAt: '10:30',
          specimens: [
            { specimenNumber: 405, moldCode: '020', status: 'CREATED' },
            { specimenNumber: 406, moldCode: '092' },
            { specimenNumber: 407, moldCode: '022' },
            { specimenNumber: 408, moldCode: '094' },
          ],
        },
      ],
    });

    const again = await as(a).get(`/field-records/${id}`).expect(200);
    expect(again.body.data.deliveries).toHaveLength(4);

    const next = await as(a).get(`/projects/${projectId}/field-records/next-numbers`).expect(200);
    expect(next.body.data).toEqual({
      registrySequence: 69,
      sampleNumber: 103,
      specimenNumber: 409,
    });
  });

  it('replaces the nested rows on every save', async () => {
    const id = idOf(
      await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-02' }),
    );
    await as(a).put(`/field-records/${id}`, mch068Form(catalog)).expect(200);
    const form = mch068Form(catalog);
    form.deliveries = form.deliveries.slice(0, 1);
    const saved = await as(a).put(`/field-records/${id}`, form).expect(200);
    expect(saved.body.data.deliveries).toHaveLength(1);
    await expect(t.prisma.specimen.count()).resolves.toBe(4);
  });

  it('rejects repeated numbers in the form (400) and numbers used by another record (409)', async () => {
    const first = idOf(
      await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-02' }),
    );
    const second = idOf(
      await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-03' }),
    );

    const repeated = mch068Form(catalog);
    (
      repeated.deliveries[0].samples[0] as { specimens: { specimenNumber: number }[] }
    ).specimens[1].specimenNumber = 405;
    const bad = await as(a).put(`/field-records/${first}`, repeated).expect(400);
    expect(bad.body.error.details).toEqual(['specimen number 405 is repeated']);

    await as(a).put(`/field-records/${first}`, mch068Form(catalog)).expect(200);
    const clash = mch068Form(catalog);
    clash.registrySequence = 70;
    await as(a).put(`/field-records/${second}`, clash).expect(409);
  });

  it('validates fields', async () => {
    const id = idOf(
      await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-02' }),
    );
    const form = { ...mch068Form(catalog), specifiedSlumpCm: 14.25, skyCondition: 'FOGGY' };
    (form.deliveries[0] as { pourStartTime: string }).pourStartTime = '25:00';
    const res = await as(a).put(`/field-records/${id}`, form).expect(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.stringContaining('specifiedSlumpCm'),
        expect.stringContaining('skyCondition'),
        expect.stringContaining('pourStartTime must be HH:MM'),
      ]),
    );
  });

  it('keeps labs apart: projects, records and catalog entries', async () => {
    const id = idOf(
      await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-02' }),
    );

    await as(b).get(`/field-records/${id}`).expect(404);
    await as(b).put(`/field-records/${id}`, mch068Form(catalog)).expect(404);
    await as(b).get(`/projects/${projectId}/field-records`).expect(404);
    await as(b)
      .post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-02' })
      .expect(404);

    // Lab B's catalog entries can't be used on lab A's record.
    const foreignSupplier = idOf(await as(b).post('/catalogs/suppliers', { name: 'CEMEX' }));
    await as(a)
      .put(`/field-records/${id}`, mch068Form({ ...catalog, supplierId: foreignSupplier }))
      .expect(404);
  });

  it('lists the project’s records, newest pour first, with counts', async () => {
    const id = idOf(
      await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-02' }),
    );
    await as(a).put(`/field-records/${id}`, mch068Form(catalog));
    await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-05' });

    const res = await as(a).get(`/projects/${projectId}/field-records`).expect(200);
    expect(res.body.data.items).toMatchObject([
      { pourDate: '2026-09-05', deliveryCount: 0, specimenCount: 0 },
      { registryNumber: 'MCH-068', deliveryCount: 4, sampleCount: 1, specimenCount: 4 },
    ]);
  });

  describe('complete and cancel (4.3, 4.4)', () => {
    let id: string;
    beforeEach(async () => {
      id = idOf(
        await as(a).post(`/projects/${projectId}/field-records`, { pourDate: '2026-09-02' }),
      );
    });

    it('refuses to complete an incomplete record (422) and lists what is missing', async () => {
      const empty = await as(a).get(`/field-records/${id}`);
      expect(empty.body.data.missingForCompletion).toEqual(
        expect.arrayContaining(['supplier', 'castElement', 'approvedByName', 'deliveries']),
      );

      const form = mch068Form(catalog);
      form.approvedByName = '';
      await as(a).put(`/field-records/${id}`, form).expect(200);
      const res = await as(a).post(`/field-records/${id}/complete`, {}).expect(422);
      expect(res.body.error).toMatchObject({
        code: 'UNPROCESSABLE_ENTITY',
        message: 'The field record is incomplete',
        details: ['approvedByName'],
      });
    });

    it('completes the MCH-068 record, then it can no longer be edited or cancelled', async () => {
      await as(a).put(`/field-records/${id}`, mch068Form(catalog)).expect(200);
      const done = await as(a).post(`/field-records/${id}/complete`, {}).expect(200);
      expect(done.body.data).toMatchObject({ status: 'COMPLETED', missingForCompletion: [] });

      await as(a).put(`/field-records/${id}`, mch068Form(catalog)).expect(409);
      await as(a).post(`/field-records/${id}/complete`, {}).expect(409);
      await as(a).post(`/field-records/${id}/cancel`, {}).expect(409);
    });

    it('cancels a draft, which is then read-only', async () => {
      const res = await as(a).post(`/field-records/${id}/cancel`, {}).expect(200);
      expect(res.body.data.status).toBe('CANCELLED');
      await as(a).put(`/field-records/${id}`, mch068Form(catalog)).expect(409);
    });

    it('returns 404 for another lab', async () => {
      await as(b).post(`/field-records/${id}/complete`, {}).expect(404);
      await as(b).post(`/field-records/${id}/cancel`, {}).expect(404);
    });
  });
});
