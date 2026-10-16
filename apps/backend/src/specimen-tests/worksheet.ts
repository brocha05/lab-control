import { formatRegistryNumber } from '../field-records/domain/numbering.js';
import {
  addDays,
  CalendarDate,
  compareCalendarDates,
  daysBetween,
} from '../shared/dates/calendar-date.js';
import { TimeOfDay } from '../shared/dates/time-of-day.js';
import { AgeToleranceResult, checkAgeTolerance } from './domain/age-tolerance.js';
import { CompressionResult, computeCompression } from './domain/compression.js';
import { scheduledTestDate } from './domain/test-schedule.js';

/**
 * The FPC06-01 worksheet ("Registro de resultados de resistencia a la compresión"): one
 * project and one test date, a derived printable view over SpecimenTests (A-72, Q-69).
 * Calculated values are derived on read with `compression.ts`, never stored (ADR-008).
 */

export interface Readings {
  height1Cm: number | null;
  height2Cm: number | null;
  diameter1Cm: number | null;
  diameter2Cm: number | null;
  maxLoadKgf: number | null;
  /** Spot check, 1 of every 10 specimens tested in a day (Q-63). */
  loadDurationS: number | null;
  /** NMX-C-083 pattern 1–6; the worksheet is authoritative (Q-60). */
  failureType: number | null;
}

export interface WorksheetCandidate {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  ageDays: number;
  keepExactDate: boolean;
  testDate: CalendarDate | null;
  testTime: TimeOfDay | null;
  readings: Readings;
  pressCode: string | null;
  dimensionEquipment: string | null;
  specimen: { id: string; specimenNumber: number | null; moldCode: string | null };
  sample: { id: string; sampleNumber: number | null; moldedAt: TimeOfDay | null };
  /** Fallback start time for the age tolerance when the molding time is missing (Q-62). */
  siteArrivalTime: TimeOfDay | null;
  fieldRecord: {
    id: string;
    registrySequence: number | null;
    pourDate: CalendarDate;
    castElement: string | null;
    specifiedStrengthKgCm2: number | null;
  };
}

export interface WorksheetRow {
  id: string;
  status: WorksheetCandidate['status'];
  ageDays: number;
  keepExactDate: boolean;
  /** Pour date + age, before any Sunday/holiday shift. */
  nominalDate: CalendarDate;
  scheduledDate: CalendarDate;
  /** Days from the pour to the test date (the sheet's date while not tested). */
  actualAgeDays: number;
  testDate: CalendarDate | null;
  testTime: TimeOfDay | null;
  specimen: WorksheetCandidate['specimen'];
  readings: Readings;
  pressCode: string | null;
  dimensionEquipment: string | null;
  /** Derived from the readings; null until the test is completed. */
  result: CompressionResult | null;
  /** null until completed; UNKNOWN without a test time (A-83, Q-89). */
  ageTolerance: AgeToleranceResult | null;
}

/** "ELEMENTO — hh:mm": one sample of one field record (FPC06-01 group header). */
export interface WorksheetGroup {
  fieldRecord: {
    id: string;
    registryNumber: string | null;
    pourDate: CalendarDate;
    castElement: string | null;
    specifiedStrengthKgCm2: number | null;
  };
  sample: WorksheetCandidate['sample'];
  rows: WorksheetRow[];
}

export interface Worksheet {
  testDate: CalendarDate;
  groups: WorksheetGroup[];
  /** Header values of the sheet, from its tested rows (null when none or mixed). */
  pressCode: string | null;
  dimensionEquipment: string | null;
  /** Load-time spot check of the day (Q-63): at least 1 of every 10 tested. */
  loadTimeChecks: { tested: number; measured: number; required: number };
}

function isComplete(r: Readings): boolean {
  return (
    r.height1Cm !== null &&
    r.height2Cm !== null &&
    r.diameter1Cm !== null &&
    r.diameter2Cm !== null &&
    r.maxLoadKgf !== null
  );
}

/** The one value every row shares, or null. */
function shared(values: (string | null)[]): string | null {
  const distinct = [...new Set(values.filter((v): v is string => v !== null))];
  return distinct.length === 1 ? distinct[0] : null;
}

/**
 * Pure. Rows of the sheet for `testDate`: tests completed that day, plus open tests
 * scheduled on or before it (overdue ones are tested on the day they are broken, A-84).
 */
export function buildWorksheet(
  candidates: readonly WorksheetCandidate[],
  testDate: CalendarDate,
  isHoliday: (date: CalendarDate) => boolean,
): Worksheet {
  const rows = candidates
    .map((c) => {
      const scheduledDate = scheduledTestDate(c.fieldRecord.pourDate, c.ageDays, {
        isHoliday,
        keepExactDate: c.keepExactDate,
      });
      return { c, scheduledDate };
    })
    .filter(({ c, scheduledDate }) =>
      c.status === 'COMPLETED'
        ? c.testDate === testDate
        : compareCalendarDates(scheduledDate, testDate) <= 0,
    );

  const groups = new Map<string, WorksheetGroup>();
  for (const { c, scheduledDate } of rows) {
    const completed = c.status === 'COMPLETED' && isComplete(c.readings);
    const strength = c.fieldRecord.specifiedStrengthKgCm2;
    const result =
      completed && strength !== null
        ? computeCompression(
            {
              height1Cm: c.readings.height1Cm as number,
              height2Cm: c.readings.height2Cm as number,
              diameter1Cm: c.readings.diameter1Cm as number,
              diameter2Cm: c.readings.diameter2Cm as number,
              maxLoadKgf: c.readings.maxLoadKgf as number,
              loadDurationS: c.readings.loadDurationS,
            },
            strength,
          )
        : null;
    const ageTolerance: AgeToleranceResult | null = !completed
      ? null
      : c.testTime && c.testDate
        ? checkAgeTolerance({
            ageDays: c.ageDays,
            castDate: c.fieldRecord.pourDate,
            moldedAt: c.sample.moldedAt,
            siteArrivalTime: c.siteArrivalTime,
            testDate: c.testDate,
            testTime: c.testTime,
          })
        : { status: 'UNKNOWN', actualHours: null, toleranceHours: null };

    const key = `${c.fieldRecord.id}:${c.sample.id}`;
    let group = groups.get(key);
    if (!group) {
      const { registrySequence, ...record } = c.fieldRecord;
      group = {
        fieldRecord: {
          ...record,
          registryNumber: registrySequence === null ? null : formatRegistryNumber(registrySequence),
        },
        sample: c.sample,
        rows: [],
      };
      groups.set(key, group);
    }
    group.rows.push({
      id: c.id,
      status: c.status,
      ageDays: c.ageDays,
      keepExactDate: c.keepExactDate,
      nominalDate: addDays(c.fieldRecord.pourDate, c.ageDays),
      scheduledDate,
      actualAgeDays: daysBetween(c.fieldRecord.pourDate, c.testDate ?? testDate),
      testDate: c.testDate,
      testTime: c.testTime,
      specimen: c.specimen,
      readings: c.readings,
      pressCode: c.pressCode,
      dimensionEquipment: c.dimensionEquipment,
      result,
      ageTolerance,
    });
  }

  const sorted = [...groups.values()].sort(
    (a, b) =>
      (a.fieldRecord.registryNumber ?? '').localeCompare(b.fieldRecord.registryNumber ?? '') ||
      (a.sample.sampleNumber ?? 0) - (b.sample.sampleNumber ?? 0),
  );
  for (const g of sorted) {
    g.rows.sort((a, b) => (a.specimen.specimenNumber ?? 0) - (b.specimen.specimenNumber ?? 0));
  }

  const tested = sorted.flatMap((g) => g.rows).filter((r) => r.status === 'COMPLETED');
  return {
    testDate,
    groups: sorted,
    pressCode: shared(tested.map((r) => r.pressCode)),
    dimensionEquipment: shared(tested.map((r) => r.dimensionEquipment)),
    loadTimeChecks: {
      tested: tested.length,
      measured: tested.filter((r) => r.readings.loadDurationS !== null).length,
      required: Math.ceil(tested.length / 10),
    },
  };
}
