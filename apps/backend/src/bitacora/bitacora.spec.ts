import { CalendarDate } from '../shared/dates/calendar-date.js';
import { TimeOfDay } from '../shared/dates/time-of-day.js';
import { buildBitacora, type BitacoraRecordInput, type BitacoraTestInput } from './bitacora.js';

const d = (s: string) => s as CalendarDate;
const noHolidays = () => false;

const open = (ageDays: number): BitacoraTestInput => ({
  status: 'SCHEDULED',
  ageDays,
  keepExactDate: false,
  testDate: null,
  height1Cm: null,
  height2Cm: null,
  diameter1Cm: null,
  diameter2Cm: null,
  maxLoadKgf: null,
});

// The lab's FPC01-02 example: MCH-068, sample 102, specimens 405–408 (3 and 7 days).
const mch068: BitacoraRecordInput = {
  id: 'fr-68',
  registrySequence: 68,
  pourDate: d('2026-09-02'),
  supplier: 'CEMEX',
  production: 'READY_MIXED',
  specifiedStrengthKgCm2: 250,
  specifiedSlumpCm: 14,
  specifiedSlumpToleranceCm: 3.5,
  maxAggregateSizeMm: 20,
  castElement: 'MURO ADICIONAL (PRIMERA SECCIÓN LADO IZQUIERDO)',
  unitWeightTareG: null,
  unitWeightTareSampleG: null,
  unitWeightMoldFactor: null,
  airContentPct: null,
  samples: [
    {
      id: 'sa-102',
      sampleNumber: 102,
      moldedAt: '10:30' as TimeOfDay,
      slump1Cm: 15,
      slump2Cm: null,
      concreteTemperatureC: 34,
      specimens: [
        { id: 'sp-406', specimenNumber: 406, test: open(3) },
        {
          id: 'sp-405',
          specimenNumber: 405,
          test: {
            ...open(3),
            status: 'COMPLETED',
            testDate: d('2026-09-05'),
            height1Cm: 29.7,
            height2Cm: 29.8,
            diameter1Cm: 14.9,
            diameter2Cm: 14.9,
            maxLoadKgf: 36470,
          },
        },
        { id: 'sp-407', specimenNumber: 407, test: open(4) },
      ],
    },
  ],
};

describe('buildBitacora', () => {
  it('builds the FPC01-02 rows with derived results', () => {
    const { records, summary } = buildBitacora([mch068], noHolidays);
    const [r] = records;
    expect(r).toMatchObject({
      registryNumber: 'MCH-068',
      maxAggregateSizeCm: 2,
      unitWeightKgM3: null,
    });
    const [s405, s406, s407] = r.samples[0].specimens;
    expect(s405).toMatchObject({
      specimenNumber: 405,
      tested: true,
      date: '2026-09-05',
      maxLoadKgf: 36470,
      areaCm2: 174.4,
      stressKgCm2: 209,
      percentOfDesign: 83.6,
    });
    expect(s406).toMatchObject({ tested: false, date: '2026-09-05', stressKgCm2: null });
    // 09-02 + 4 = Sunday 09-06 → Monday 09-07.
    expect(s407.date).toBe('2026-09-07');
    expect(summary).toEqual({ records: 1, samples: 1, specimens: 3, tested: 1 });
  });

  it('derives the unit weight and sorts records by pour date', () => {
    const later = {
      ...mch068,
      id: 'fr-70',
      registrySequence: 70,
      pourDate: d('2026-09-10'),
      unitWeightTareG: 4000,
      unitWeightTareSampleG: 20100,
      unitWeightMoldFactor: 0.1416,
    };
    const { records } = buildBitacora([later, mch068], noHolidays);
    expect(records.map((r) => r.registryNumber)).toEqual(['MCH-068', 'MCH-070']);
    // (20100 − 4000) × 0.1416 = 2279.76 → 2280.
    expect(records[1].unitWeightKgM3).toBe(2280);
  });
});
