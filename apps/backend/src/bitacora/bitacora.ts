import { formatRegistryNumber } from '../field-records/domain/numbering.js';
import { CalendarDate } from '../shared/dates/calendar-date.js';
import { TimeOfDay } from '../shared/dates/time-of-day.js';
import {
  computeCompression,
  roundHalfUp,
  unitWeight,
} from '../specimen-tests/domain/compression.js';
import { scheduledTestDate } from '../specimen-tests/domain/test-schedule.js';

/**
 * The Bitácora (FPC01-02): one row per specimen, the record and sample data repeated
 * (merged cells on the lab's sheet). A derived read model (ADR-004); results come from
 * compression.ts on read (ADR-008). One project per Bitácora (Q-68).
 */

export interface BitacoraTestInput {
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  ageDays: number;
  keepExactDate: boolean;
  testDate: CalendarDate | null;
  height1Cm: number | null;
  height2Cm: number | null;
  diameter1Cm: number | null;
  diameter2Cm: number | null;
  maxLoadKgf: number | null;
}

export interface BitacoraRecordInput {
  id: string;
  registrySequence: number | null;
  pourDate: CalendarDate;
  supplier: string | null;
  production: 'SITE_MIXED' | 'READY_MIXED' | null;
  specifiedStrengthKgCm2: number | null;
  specifiedSlumpCm: number | null;
  specifiedSlumpToleranceCm: number | null;
  maxAggregateSizeMm: number | null;
  castElement: string | null;
  unitWeightTareG: number | null;
  unitWeightTareSampleG: number | null;
  unitWeightMoldFactor: number | null;
  airContentPct: number | null;
  samples: {
    id: string;
    sampleNumber: number | null;
    moldedAt: TimeOfDay | null;
    /** The sampled truck (Q-66): both slump readings, no average. */
    slump1Cm: number | null;
    slump2Cm: number | null;
    concreteTemperatureC: number | null;
    specimens: {
      id: string;
      specimenNumber: number | null;
      /** null when the specimen has no current test. */
      test: BitacoraTestInput | null;
    }[];
  }[];
}

export interface BitacoraSpecimen {
  id: string;
  specimenNumber: number | null;
  ageDays: number | null;
  /** Test date once tested; otherwise the scheduled date (Sunday/holiday shift). */
  date: CalendarDate | null;
  tested: boolean;
  maxLoadKgf: number | null;
  areaCm2: number | null;
  stressKgCm2: number | null;
  percentOfDesign: number | null;
}

export interface BitacoraSample {
  id: string;
  sampleNumber: number | null;
  moldedAt: TimeOfDay | null;
  slump1Cm: number | null;
  slump2Cm: number | null;
  concreteTemperatureC: number | null;
  specimens: BitacoraSpecimen[];
}

export interface BitacoraRecord {
  id: string;
  /** "Informe" column: the registro number (MCH-068), not the report number. */
  registryNumber: string | null;
  pourDate: CalendarDate;
  supplier: string | null;
  production: BitacoraRecordInput['production'];
  specifiedStrengthKgCm2: number | null;
  specifiedSlumpCm: number | null;
  specifiedSlumpToleranceCm: number | null;
  /** The sheet prints T.M.A. in cm; FPC01-01 writes mm. */
  maxAggregateSizeCm: number | null;
  castElement: string | null;
  /** A-94: rounded to 1 kg/m³; the lab gave no rounding (Q-67). */
  unitWeightKgM3: number | null;
  airContentPct: number | null;
  samples: BitacoraSample[];
}

export interface BitacoraSummary {
  records: number;
  samples: number;
  specimens: number;
  tested: number;
}

export interface Bitacora {
  records: BitacoraRecord[];
  summary: BitacoraSummary;
}

function isComplete(t: BitacoraTestInput): boolean {
  return [t.height1Cm, t.height2Cm, t.diameter1Cm, t.diameter2Cm, t.maxLoadKgf].every(
    (v) => v !== null,
  );
}

function recordUnitWeight(r: BitacoraRecordInput): number | null {
  if (r.unitWeightTareG === null || r.unitWeightTareSampleG === null || !r.unitWeightMoldFactor) {
    return null;
  }
  if (r.unitWeightTareSampleG <= r.unitWeightTareG) return null;
  return roundHalfUp(
    unitWeight(r.unitWeightTareG, r.unitWeightTareSampleG, r.unitWeightMoldFactor),
    0,
  );
}

/** Pure. Records by pour date then number; samples and specimens by number. */
export function buildBitacora(
  records: readonly BitacoraRecordInput[],
  isHoliday: (date: CalendarDate) => boolean,
): Bitacora {
  const out = records.map((r): BitacoraRecord => {
    const samples = [...r.samples]
      .sort((a, b) => (a.sampleNumber ?? 0) - (b.sampleNumber ?? 0))
      .map((s): BitacoraSample => ({
        id: s.id,
        sampleNumber: s.sampleNumber,
        moldedAt: s.moldedAt,
        slump1Cm: s.slump1Cm,
        slump2Cm: s.slump2Cm,
        concreteTemperatureC: s.concreteTemperatureC,
        specimens: [...s.specimens]
          .sort((a, b) => (a.specimenNumber ?? 0) - (b.specimenNumber ?? 0))
          .map((sp): BitacoraSpecimen => {
            const t = sp.test;
            const tested = !!t && t.status === 'COMPLETED' && isComplete(t);
            const result =
              tested && t && r.specifiedStrengthKgCm2 !== null
                ? computeCompression(
                    {
                      height1Cm: t.height1Cm as number,
                      height2Cm: t.height2Cm as number,
                      diameter1Cm: t.diameter1Cm as number,
                      diameter2Cm: t.diameter2Cm as number,
                      maxLoadKgf: t.maxLoadKgf as number,
                    },
                    r.specifiedStrengthKgCm2,
                  )
                : null;
            return {
              id: sp.id,
              specimenNumber: sp.specimenNumber,
              ageDays: t?.ageDays ?? null,
              date: !t
                ? null
                : tested
                  ? t.testDate
                  : scheduledTestDate(r.pourDate, t.ageDays, {
                      isHoliday,
                      keepExactDate: t.keepExactDate,
                    }),
              tested,
              maxLoadKgf: tested ? t.maxLoadKgf : null,
              areaCm2: result?.areaCm2 ?? null,
              stressKgCm2: result?.stressKgCm2 ?? null,
              percentOfDesign: result?.percentOfDesign ?? null,
            };
          }),
      }));
    return {
      id: r.id,
      registryNumber: r.registrySequence === null ? null : formatRegistryNumber(r.registrySequence),
      pourDate: r.pourDate,
      supplier: r.supplier,
      production: r.production,
      specifiedStrengthKgCm2: r.specifiedStrengthKgCm2,
      specifiedSlumpCm: r.specifiedSlumpCm,
      specifiedSlumpToleranceCm: r.specifiedSlumpToleranceCm,
      maxAggregateSizeCm:
        r.maxAggregateSizeMm === null ? null : roundHalfUp(r.maxAggregateSizeMm / 10, 1),
      castElement: r.castElement,
      unitWeightKgM3: recordUnitWeight(r),
      airContentPct: r.airContentPct,
      samples,
    };
  });

  out.sort(
    (a, b) =>
      a.pourDate.localeCompare(b.pourDate) ||
      (a.registryNumber ?? '').localeCompare(b.registryNumber ?? ''),
  );
  const specimens = out.flatMap((r) => r.samples.flatMap((s) => s.specimens));
  return {
    records: out,
    summary: {
      records: out.length,
      samples: out.reduce((n, r) => n + r.samples.length, 0),
      specimens: specimens.length,
      tested: specimens.filter((s) => s.tested).length,
    },
  };
}
