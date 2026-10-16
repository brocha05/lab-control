// Mirrors apps/backend/src/bitacora/bitacora.ts (FPC01-02, ADR-004).

export interface BitacoraSpecimen {
  id: string;
  specimenNumber: number | null;
  ageDays: number | null;
  /** Test date once tested; otherwise the scheduled date. */
  date: string | null;
  tested: boolean;
  maxLoadKgf: number | null;
  areaCm2: number | null;
  stressKgCm2: number | null;
  percentOfDesign: number | null;
}

export interface BitacoraSample {
  id: string;
  sampleNumber: number | null;
  moldedAt: string | null;
  slump1Cm: number | null;
  slump2Cm: number | null;
  concreteTemperatureC: number | null;
  specimens: BitacoraSpecimen[];
}

export interface BitacoraRecord {
  id: string;
  registryNumber: string | null;
  pourDate: string;
  supplier: string | null;
  production: 'SITE_MIXED' | 'READY_MIXED' | null;
  specifiedStrengthKgCm2: number | null;
  specifiedSlumpCm: number | null;
  specifiedSlumpToleranceCm: number | null;
  maxAggregateSizeCm: number | null;
  castElement: string | null;
  unitWeightKgM3: number | null;
  airContentPct: number | null;
  samples: BitacoraSample[];
}

export interface Bitacora {
  project: { id: string; name: string; code: string | null; client: { id: string; name: string } };
  records: BitacoraRecord[];
  summary: { records: number; samples: number; specimens: number; tested: number };
}

export interface BitacoraParams {
  from?: string;
  to?: string;
}
