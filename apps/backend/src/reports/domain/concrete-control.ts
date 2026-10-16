import { formatRegistryNumber } from '../../field-records/domain/numbering.js';
import { CalendarDate } from '../../shared/dates/calendar-date.js';
import { TimeOfDay } from '../../shared/dates/time-of-day.js';
import { checkAgeTolerance } from '../../specimen-tests/domain/age-tolerance.js';
import {
  averageAtAge,
  type CompressionResult,
  computeCompression,
} from '../../specimen-tests/domain/compression.js';

/**
 * The `concrete-control` report (FPC06-04, "Informe de pruebas de control de concreto
 * hidráulico"): one report per field record, one page per sample, a second page above 6
 * specimens (Q-71). Pure: assembles the frozen snapshot the PDF is rendered from
 * (ADR-005). Every printed value is in the snapshot; the template computes nothing.
 */

export const TEMPLATE_KEY = 'concrete-control';
export const TEMPLATE_VERSION = '1';
export const SNAPSHOT_SCHEMA_VERSION = 1;
export const SPECIMENS_PER_PAGE = 6;

export interface ReportTestInput {
  specimenNumber: number | null;
  ageDays: number;
  testDate: CalendarDate | null;
  testTime: TimeOfDay | null;
  height1Cm: number | null;
  height2Cm: number | null;
  diameter1Cm: number | null;
  diameter2Cm: number | null;
  maxLoadKgf: number | null;
  failureType: number | null;
  /** false while the test isn't completed. */
  completed: boolean;
}

export interface ReportInput {
  lab: { name: string; legalName: string | null; address: string | null; phone: string | null };
  project: { name: string; code: string | null };
  client: {
    name: string;
    code: string | null;
    contactName: string | null;
    contactPhone: string | null;
  };
  record: {
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
    registrySequence: number | null;
    frontNumber: number;
    pourDate: CalendarDate;
    castElement: string | null;
    specifiedStrengthKgCm2: number | null;
    specifiedSlumpCm: number | null;
    specifiedSlumpToleranceCm: number | null;
    supplier: string | null;
    cementType: string | null;
  };
  samples: {
    sampleNumber: number | null;
    moldedAt: TimeOfDay | null;
    siteArrivalTime: TimeOfDay | null;
    concreteTemperatureC: number | null;
    slump1Cm: number | null;
    slump2Cm: number | null;
    /** Current tests of the sample's non-cancelled specimens. */
    tests: ReportTestInput[];
  }[];
  /** Typed by the report author (Q-64). */
  fields: {
    mixingEquipment: string | null;
    compactionMethod: string | null;
    mixDesignReference: string | null;
    admixture: string | null;
    observations: string | null;
  };
}

export interface SnapshotSpecimen {
  specimenNumber: number | null;
  pourDate: CalendarDate;
  testDate: CalendarDate;
  ageDays: number;
  meanDiameterCm: number;
  areaCm2: number;
  maxLoadKgf: number;
  maxLoadN: number;
  stressKgCm2: number;
  stressMPa: number;
  percentOfDesign: number;
  failureType: number | null;
  /** Tested outside the NMX-C-083 age window; the report notes it (Q-23). */
  outsideAgeTolerance: boolean;
}

/** Average of one age on a page; `span` adjacent specimen columns share it. */
export interface SnapshotAverage {
  ageDays: number;
  span: number;
  stressKgCm2: number;
  stressMPa: number;
  percentOfDesign: number;
}

export interface SnapshotPage {
  sampleNumber: number | null;
  concreteTemperatureC: number | null;
  /** The sampled truck's readings: both when repeated, never averaged (Q-66). */
  slumpsCm: number[];
  specimens: SnapshotSpecimen[];
  averages: SnapshotAverage[];
  /** Empty columns up to 6, struck through on the form. */
  emptyColumns: number;
}

export interface ConcreteControlSnapshot {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  templateKey: typeof TEMPLATE_KEY;
  reportNumber: string;
  version: number;
  issueDate: CalendarDate;
  lab: ReportInput['lab'];
  project: { name: string };
  client: { name: string; contactName: string | null; contactPhone: string | null };
  record: {
    registryNumber: string;
    pourDate: CalendarDate;
    castElement: string | null;
    specifiedStrengthKgCm2: number;
    specifiedSlumpCm: number | null;
    specifiedSlumpToleranceCm: number | null;
    supplier: string | null;
    cementType: string | null;
  };
  fields: ReportInput['fields'];
  pages: SnapshotPage[];
  /** Specimen numbers tested outside the age tolerance. */
  outsideAgeTolerance: number[];
}

export class ReportNotReadyError extends Error {
  constructor(readonly missing: string[]) {
    super('The record is not ready for a report');
    this.name = 'ReportNotReadyError';
  }
}

const pad3 = (n: number) => String(n).padStart(3, '0');

/** "MAR-PVLT-F1-CTO-REC-068" (Q-56): client, project, front, test type, registro. */
export function reportNumber(input: Pick<ReportInput, 'client' | 'project' | 'record'>): string {
  const { client, project, record } = input;
  return `${client.code}-${project.code}-F${record.frontNumber}-CTO-REC-${pad3(record.registrySequence ?? 0)}`;
}

/**
 * What blocks a full report (Q-35): the record completed, codes for the number, and
 * every specimen tested. Partial reports wait for Q-82.
 */
export function missingForReport(input: ReportInput): string[] {
  const out: string[] = [];
  if (input.record.status !== 'COMPLETED') out.push('record.status');
  if (!input.client.code) out.push('client.code');
  if (!input.project.code) out.push('project.code');
  if (input.record.registrySequence === null) out.push('record.registrySequence');
  if (input.record.specifiedStrengthKgCm2 === null) out.push('record.specifiedStrengthKgCm2');
  for (const s of input.samples) {
    for (const t of s.tests) {
      if (!t.completed) out.push(`specimens[${t.specimenNumber ?? '?'}].test`);
    }
  }
  if (input.samples.every((s) => s.tests.length === 0)) out.push('specimens');
  return out;
}

/** Pure. Throws ReportNotReadyError with the missing items. */
export function assembleConcreteControl(
  input: ReportInput,
  meta: { version: number; issueDate: CalendarDate },
): ConcreteControlSnapshot {
  const missing = missingForReport(input);
  if (missing.length) throw new ReportNotReadyError(missing);
  const strength = input.record.specifiedStrengthKgCm2 as number;
  const outside: number[] = [];

  const pages: SnapshotPage[] = [];
  const samples = [...input.samples].sort((a, b) => (a.sampleNumber ?? 0) - (b.sampleNumber ?? 0));
  for (const s of samples) {
    const tested = [...s.tests]
      .sort((a, b) => a.ageDays - b.ageDays || (a.specimenNumber ?? 0) - (b.specimenNumber ?? 0))
      .map((t) => {
        const result = computeCompression(
          {
            height1Cm: t.height1Cm as number,
            height2Cm: t.height2Cm as number,
            diameter1Cm: t.diameter1Cm as number,
            diameter2Cm: t.diameter2Cm as number,
            maxLoadKgf: t.maxLoadKgf as number,
          },
          strength,
        );
        const tolerance =
          t.testTime && t.testDate
            ? checkAgeTolerance({
                ageDays: t.ageDays,
                castDate: input.record.pourDate,
                moldedAt: s.moldedAt,
                siteArrivalTime: s.siteArrivalTime,
                testDate: t.testDate,
                testTime: t.testTime,
              })
            : null;
        const outsideAgeTolerance = tolerance?.status === 'OUTSIDE';
        if (outsideAgeTolerance && t.specimenNumber !== null) outside.push(t.specimenNumber);
        return { t, result, outsideAgeTolerance };
      });

    // Averages per age over the whole sample (siblings, Q-14), from rounded values (A-80).
    const byAge = new Map<number, CompressionResult[]>();
    for (const { t, result } of tested)
      byAge.set(t.ageDays, [...(byAge.get(t.ageDays) ?? []), result]);
    const averageOf = new Map([...byAge].map(([age, results]) => [age, averageAtAge(results)]));

    for (let i = 0; i < tested.length; i += SPECIMENS_PER_PAGE) {
      const chunk = tested.slice(i, i + SPECIMENS_PER_PAGE);
      const averages: SnapshotAverage[] = [];
      for (const { t } of chunk) {
        const last = averages[averages.length - 1];
        if (last && last.ageDays === t.ageDays) last.span++;
        else {
          const avg = averageOf.get(t.ageDays) as ReturnType<typeof averageAtAge>;
          averages.push({ ageDays: t.ageDays, span: 1, ...avg });
        }
      }
      pages.push({
        sampleNumber: s.sampleNumber,
        concreteTemperatureC: s.concreteTemperatureC,
        slumpsCm: [s.slump1Cm, s.slump2Cm].filter((v): v is number => v !== null),
        specimens: chunk.map(({ t, result, outsideAgeTolerance }) => ({
          specimenNumber: t.specimenNumber,
          pourDate: input.record.pourDate,
          testDate: t.testDate as CalendarDate,
          ageDays: t.ageDays,
          meanDiameterCm: result.meanDiameterCm,
          areaCm2: result.areaCm2,
          maxLoadKgf: t.maxLoadKgf as number,
          maxLoadN: result.maxLoadN,
          stressKgCm2: result.stressKgCm2,
          stressMPa: result.stressMPa,
          percentOfDesign: result.percentOfDesign,
          failureType: t.failureType,
          outsideAgeTolerance,
        })),
        averages,
        emptyColumns: SPECIMENS_PER_PAGE - chunk.length,
      });
    }
  }

  const { record } = input;
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    templateKey: TEMPLATE_KEY,
    reportNumber: reportNumber(input),
    version: meta.version,
    issueDate: meta.issueDate,
    lab: input.lab,
    project: { name: input.project.name },
    client: {
      name: input.client.name,
      contactName: input.client.contactName,
      contactPhone: input.client.contactPhone,
    },
    record: {
      registryNumber: formatRegistryNumber(record.registrySequence as number),
      pourDate: record.pourDate,
      castElement: record.castElement,
      specifiedStrengthKgCm2: strength,
      specifiedSlumpCm: record.specifiedSlumpCm,
      specifiedSlumpToleranceCm: record.specifiedSlumpToleranceCm,
      supplier: record.supplier,
      cementType: record.cementType,
    },
    fields: input.fields,
    pages,
    outsideAgeTolerance: outside.sort((a, b) => a - b),
  };
}
