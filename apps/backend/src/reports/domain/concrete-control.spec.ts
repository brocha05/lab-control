import { CalendarDate } from '../../shared/dates/calendar-date.js';
import { TimeOfDay } from '../../shared/dates/time-of-day.js';
import {
  assembleConcreteControl,
  missingForReport,
  ReportNotReadyError,
  reportNumber,
  type ReportInput,
  type ReportTestInput,
} from './concrete-control.js';

const d = (s: string) => s as CalendarDate;
const t = (s: string) => s as TimeOfDay;

// The lab's report MAR-PVLT-F1-CTO-REC-068 (FPC06-04): sample 102, specimens 405–408.
const test = (
  n: number,
  ageDays: number,
  testDate: string,
  r: [number, number, number, number, number],
  over: Partial<ReportTestInput> = {},
): ReportTestInput => ({
  specimenNumber: n,
  ageDays,
  testDate: d(testDate),
  testTime: null,
  height1Cm: r[0],
  height2Cm: r[1],
  diameter1Cm: r[2],
  diameter2Cm: r[3],
  maxLoadKgf: r[4],
  failureType: null,
  completed: true,
  ...over,
});

function input(tests: ReportTestInput[]): ReportInput {
  return {
    lab: { name: 'CCP', legalName: null, address: 'Colima', phone: null },
    project: { name: 'CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"', code: 'PVLT' },
    client: {
      name: 'MARECOMSA S.A. DE C.V.',
      code: 'MAR',
      contactName: 'Ing. J. V.',
      contactPhone: null,
    },
    record: {
      status: 'COMPLETED',
      registrySequence: 68,
      frontNumber: 1,
      pourDate: d('2026-09-02'),
      castElement: 'MURO ADICIONAL',
      specifiedStrengthKgCm2: 250,
      specifiedSlumpCm: 14,
      specifiedSlumpToleranceCm: 3.5,
      supplier: 'CEMEX',
      cementType: 'CPC 40',
    },
    samples: [
      {
        sampleNumber: 102,
        moldedAt: t('10:30'),
        siteArrivalTime: t('10:15'),
        concreteTemperatureC: 34,
        slump1Cm: 15,
        slump2Cm: null,
        tests,
      },
    ],
    fields: {
      mixingEquipment: 'CAMIÓN MEZCLADOR',
      compactionMethod: null,
      mixDesignReference: null,
      admixture: null,
      observations: null,
    },
  };
}

const MCH068 = [
  test(407, 7, '2026-09-09', [30.0, 30.0, 15.0, 14.9, 53120], { failureType: 3 }),
  test(405, 3, '2026-09-05', [29.7, 29.8, 14.9, 14.9, 36470]),
  test(406, 3, '2026-09-05', [30.0, 30.0, 15.1, 15.0, 37900]),
  test(408, 7, '2026-09-09', [29.9, 30.0, 15.0, 15.0, 53490]),
];

describe('concrete-control report', () => {
  it('numbers the report like the lab (Q-56)', () => {
    expect(reportNumber(input([]))).toBe('MAR-PVLT-F1-CTO-REC-068');
  });

  it('builds one page per sample with the specimens by age and per-age averages', () => {
    const snap = assembleConcreteControl(input(MCH068), { version: 1, issueDate: d('2026-09-10') });
    expect(snap.reportNumber).toBe('MAR-PVLT-F1-CTO-REC-068');
    expect(snap.record.registryNumber).toBe('MCH-068');
    expect(snap.pages).toHaveLength(1);
    const [page] = snap.pages;
    expect(page.specimens.map((s) => s.specimenNumber)).toEqual([405, 406, 407, 408]);
    expect(page.specimens[0]).toMatchObject({
      meanDiameterCm: 14.9,
      areaCm2: 174.4,
      maxLoadN: 357771,
      stressKgCm2: 209,
      stressMPa: 20.5,
      percentOfDesign: 83.6,
    });
    expect(page.specimens[2].failureType).toBe(3);
    // Rounded values averaged (A-80): (209 + 212) / 2 = 210.5.
    expect(page.averages).toEqual([
      { ageDays: 3, span: 2, stressKgCm2: 210.5, stressMPa: 20.6, percentOfDesign: 84.2 },
      { ageDays: 7, span: 2, stressKgCm2: 302, stressMPa: 29.6, percentOfDesign: 120.8 },
    ]);
    expect(page.emptyColumns).toBe(2);
    expect(page.slumpsCm).toEqual([15]);
  });

  it('starts a second page above 6 specimens (Q-71)', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      test(500 + i, i < 4 ? 7 : 28, '2026-09-30', [30, 30, 15, 15, 40000]),
    );
    const snap = assembleConcreteControl(input(many), { version: 1, issueDate: d('2026-10-01') });
    expect(snap.pages.map((p) => p.specimens.length)).toEqual([6, 2]);
    expect(snap.pages[1].averages).toEqual([expect.objectContaining({ ageDays: 28, span: 2 })]);
  });

  it('notes specimens tested outside the age tolerance (Q-23)', () => {
    const late = [
      test(405, 3, '2026-09-05', [29.7, 29.8, 14.9, 14.9, 36470], { testTime: t('15:00') }),
    ];
    const snap = assembleConcreteControl(input(late), { version: 1, issueDate: d('2026-09-10') });
    expect(snap.outsideAgeTolerance).toEqual([405]);
    expect(snap.pages[0].specimens[0].outsideAgeTolerance).toBe(true);
  });

  it('refuses while tests or codes are missing', () => {
    const pending = input([{ ...MCH068[0], completed: false }]);
    pending.client.code = null;
    expect(missingForReport(pending)).toEqual(['client.code', 'specimens[407].test']);
    expect(() =>
      assembleConcreteControl(pending, { version: 1, issueDate: d('2026-09-10') }),
    ).toThrow(ReportNotReadyError);
  });
});
