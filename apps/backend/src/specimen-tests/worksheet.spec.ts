import { CalendarDate } from '../shared/dates/calendar-date.js';
import { TimeOfDay } from '../shared/dates/time-of-day.js';
import { buildWorksheet, type Readings, type WorksheetCandidate } from './worksheet.js';

const d = (s: string) => s as CalendarDate;
const t = (s: string) => s as TimeOfDay;
const noHolidays = () => false;

const EMPTY: Readings = {
  height1Cm: null,
  height2Cm: null,
  diameter1Cm: null,
  diameter2Cm: null,
  maxLoadKgf: null,
  loadDurationS: null,
  failureType: null,
};

// MCH-068, poured 2026-09-02, sample molded 10:30; specimen 405 broken at 3 days.
function candidate(over: Partial<WorksheetCandidate> & { n: number }): WorksheetCandidate {
  const { n, ...rest } = over;
  return {
    id: `t${n}`,
    status: 'SCHEDULED',
    ageDays: 3,
    keepExactDate: false,
    testDate: null,
    testTime: null,
    readings: EMPTY,
    pressCode: null,
    dimensionEquipment: null,
    specimen: { id: `s${n}`, specimenNumber: n, moldCode: null },
    sample: { id: 'sample-102', sampleNumber: 102, moldedAt: t('10:30') },
    siteArrivalTime: t('10:15'),
    fieldRecord: {
      id: 'fr-68',
      registrySequence: 68,
      pourDate: d('2026-09-02'),
      castElement: 'MURO ADICIONAL',
      specifiedStrengthKgCm2: 250,
    },
    ...rest,
  };
}

describe('buildWorksheet', () => {
  it('lists open tests due on or before the date and computes completed ones', () => {
    const sheet = buildWorksheet(
      [
        candidate({
          n: 405,
          status: 'COMPLETED',
          testDate: d('2026-09-05'),
          testTime: t('10:00'),
          pressCode: 'CCP-PRE-05',
          readings: {
            ...EMPTY,
            height1Cm: 29.7,
            height2Cm: 29.8,
            diameter1Cm: 14.9,
            diameter2Cm: 14.9,
            maxLoadKgf: 36470,
          },
        }),
        candidate({ n: 406 }),
        candidate({ n: 407, ageDays: 7 }), // due 09-09: not on the 05-09 sheet
      ],
      d('2026-09-05'),
      noHolidays,
    );

    expect(sheet.groups).toHaveLength(1);
    expect(sheet.groups[0].fieldRecord.registryNumber).toBe('MCH-068');
    const [r405, r406] = sheet.groups[0].rows;
    expect(sheet.groups[0].rows.map((r) => r.specimen.specimenNumber)).toEqual([405, 406]);
    expect(r405.result).toMatchObject({ areaCm2: 174.4, stressKgCm2: 209, percentOfDesign: 83.6 });
    // 3 days = 72 h; 10:30 on 09-02 to 10:00 on 09-05 is 71.5 h, within ±2 h.
    expect(r405.ageTolerance).toMatchObject({ status: 'WITHIN', actualHours: 71.5 });
    expect(r406.result).toBeNull();
    expect(r406.actualAgeDays).toBe(3);
    expect(sheet.pressCode).toBe('CCP-PRE-05');
    expect(sheet.loadTimeChecks).toEqual({ tested: 1, measured: 0, required: 1 });
  });

  it('keeps overdue open tests and drops tests completed on another day', () => {
    const sheet = buildWorksheet(
      [
        candidate({ n: 405 }), // due 09-05, still open on 09-08
        candidate({
          n: 406,
          status: 'COMPLETED',
          testDate: d('2026-09-05'),
          readings: {
            ...EMPTY,
            height1Cm: 30,
            height2Cm: 30,
            diameter1Cm: 15.1,
            diameter2Cm: 15,
            maxLoadKgf: 37900,
          },
        }),
      ],
      d('2026-09-08'),
      noHolidays,
    );
    expect(sheet.groups[0].rows.map((r) => r.specimen.specimenNumber)).toEqual([405]);
    expect(sheet.groups[0].rows[0].actualAgeDays).toBe(6);
  });

  it('marks the tolerance UNKNOWN without a test time (A-83)', () => {
    const sheet = buildWorksheet(
      [
        candidate({
          n: 405,
          status: 'COMPLETED',
          testDate: d('2026-09-05'),
          readings: {
            ...EMPTY,
            height1Cm: 29.7,
            height2Cm: 29.8,
            diameter1Cm: 14.9,
            diameter2Cm: 14.9,
            maxLoadKgf: 36470,
            loadDurationS: 114,
          },
        }),
      ],
      d('2026-09-05'),
      noHolidays,
    );
    const row = sheet.groups[0].rows[0];
    expect(row.ageTolerance?.status).toBe('UNKNOWN');
    expect(row.result?.loadingRateKgCm2PerS).toBe(1.83);
    expect(sheet.loadTimeChecks.measured).toBe(1);
  });

  it('uses the Sunday shift for the scheduled date', () => {
    // Poured Wed 2026-09-02 + 4 days = Sunday 09-06 → Monday 09-07.
    const sheet = buildWorksheet([candidate({ n: 405, ageDays: 4 })], d('2026-09-06'), noHolidays);
    expect(sheet.groups).toHaveLength(0);
    const monday = buildWorksheet([candidate({ n: 405, ageDays: 4 })], d('2026-09-07'), noHolidays);
    expect(monday.groups[0].rows[0].scheduledDate).toBe('2026-09-07');
  });
});
