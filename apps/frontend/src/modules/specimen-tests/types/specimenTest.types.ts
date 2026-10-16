// Mirrors apps/backend/src/specimen-tests/pending-tests.ts and specimen-tests.service.ts.

export type DueStatus = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
export type SpecimenTestStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PendingTest {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS';
  ageDays: number;
  keepExactDate: boolean;
  /** Pour date + age, before the Sunday/holiday shift. `YYYY-MM-DD`. */
  nominalDate: string;
  /** The day to test (Q-21). `YYYY-MM-DD`. */
  scheduledDate: string;
  dueStatus: DueStatus;
  specimen: { id: string; specimenNumber: number | null; moldCode: string | null };
  sample: { sampleNumber: number | null; moldedAt: string | null };
  fieldRecord: {
    id: string;
    registryNumber: string | null;
    pourDate: string;
    castElement: string | null;
  };
  project: { id: string; name: string; code: string | null };
}

export interface PendingTestsParams {
  /** Last scheduled date to include, `YYYY-MM-DD`. */
  until?: string;
  projectId?: string;
}

export interface RescheduleInput {
  ageDays?: number;
  keepExactDate?: boolean;
}

// ─── FPC06-01 worksheet (apps/backend/src/specimen-tests/worksheet.ts) ──────────

export interface Readings {
  height1Cm: number | null;
  height2Cm: number | null;
  diameter1Cm: number | null;
  diameter2Cm: number | null;
  maxLoadKgf: number | null;
  loadDurationS: number | null;
  failureType: number | null;
}

/** `CompressionResult` of compression.ts. */
export interface CompressionResult {
  meanHeightCm: number;
  meanDiameterCm: number;
  areaCm2: number;
  maxLoadN: number;
  stressKgCm2: number;
  stressMPa: number;
  percentOfDesign: number;
  loadingRateKgCm2PerS: number | null;
}

export interface AgeToleranceResult {
  status: 'WITHIN' | 'OUTSIDE' | 'UNKNOWN';
  actualHours: number | null;
  toleranceHours: number | null;
}

export interface WorksheetRow {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  ageDays: number;
  keepExactDate: boolean;
  nominalDate: string;
  scheduledDate: string;
  actualAgeDays: number;
  testDate: string | null;
  testTime: string | null;
  specimen: { id: string; specimenNumber: number | null; moldCode: string | null };
  readings: Readings;
  pressCode: string | null;
  dimensionEquipment: string | null;
  result: CompressionResult | null;
  ageTolerance: AgeToleranceResult | null;
}

export interface WorksheetGroup {
  fieldRecord: {
    id: string;
    registryNumber: string | null;
    pourDate: string;
    castElement: string | null;
    specifiedStrengthKgCm2: number | null;
  };
  sample: { id: string; sampleNumber: number | null; moldedAt: string | null };
  rows: WorksheetRow[];
}

export interface Worksheet {
  project: { id: string; name: string; code: string | null; client: { id: string; name: string } };
  testDate: string;
  groups: WorksheetGroup[];
  pressCode: string | null;
  dimensionEquipment: string | null;
  loadTimeChecks: { tested: number; measured: number; required: number };
}

export interface TestResultRow {
  testId: string;
  testTime: string | null;
  height1Cm: number;
  height2Cm: number;
  diameter1Cm: number;
  diameter2Cm: number;
  maxLoadKgf: number;
  loadDurationS: number | null;
  failureType: number | null;
}

/** Body of PUT /tests/results. */
export interface SaveTestResultsInput {
  testDate: string;
  pressCode: string | null;
  dimensionEquipment: string | null;
  rows: TestResultRow[];
}
