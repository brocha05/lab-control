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
