// Mirrors apps/backend/src/reports/reports.service.ts (FPC06-04, ADR-005).

export type ReportStatus = 'DRAFT' | 'GENERATED' | 'FINAL';

export interface ReportFields {
  mixingEquipment: string | null;
  compactionMethod: string | null;
  mixDesignReference: string | null;
  admixture: string | null;
  observations: string | null;
}

export interface Report extends ReportFields {
  id: string;
  fieldRecord: {
    id: string;
    registryNumber: string | null;
    pourDate: string;
    castElement: string | null;
  };
  project: { id: string; name: string; code: string | null };
  templateKey: string;
  version: number;
  status: ReportStatus;
  reportNumber: string | null;
  hasPdf: boolean;
  contentSha256: string | null;
  generatedAt: string | null;
  finalizedAt: string | null;
  /** A later corrected version replaced this FINAL one. */
  supersededAt: string | null;
  createdAt: string;
}

export interface RecordReports {
  /** What blocks a full report; empty when ready. */
  missing: string[];
  reports: Report[];
}
