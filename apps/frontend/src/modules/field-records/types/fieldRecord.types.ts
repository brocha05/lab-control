import type { PaginationParams } from '@/types';

// Mirrors apps/backend/src/field-records/field-records.views.ts. Decimals are numbers,
// dates `YYYY-MM-DD`, times `HH:MM`.

export type FieldRecordStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type ConcreteProduction = 'SITE_MIXED' | 'READY_MIXED';
export type StrengthCriterion = 'FC' | 'MR';
export type SkyCondition = 'SUNNY' | 'CLOUDY' | 'RAINY';
export type WindCondition = 'WINDY' | 'CALM';
export type LightingCondition = 'NATURAL' | 'ARTIFICIAL';
export type SpecimenType =
  'CYLINDER_15X30' | 'CYLINDER_10X20' | 'BEAM_15X60' | 'BEAM_15X50' | 'CUBE_15' | 'CUBE_10';

interface Named {
  id: string;
  name: string;
}

export interface FieldRecordSummary {
  id: string;
  status: FieldRecordStatus;
  registrySequence: number | null;
  registryNumber: string | null;
  frontNumber: number;
  pourDate: string;
  castElement: string | null;
  deliveryCount: number;
  sampleCount: number;
  specimenCount: number;
}

export interface SpecimenView {
  id: string;
  status: 'CREATED' | 'CANCELLED';
  specimenNumber: number | null;
  moldCode: string | null;
  /** Current (non-cancelled) test, planned when the record is completed. */
  test: {
    id: string;
    ageDays: number;
    keepExactDate: boolean;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  } | null;
}

export interface SampleView {
  id: string;
  sampleNumber: number | null;
  specimenType: SpecimenType | null;
  moldedAt: string | null;
  specimens: SpecimenView[];
}

export interface DeliveryView {
  id: string;
  sequence: number;
  sheet: number;
  ticketNumber: string | null;
  volumeM3: number | null;
  cumulativeVolumeM3: number | null;
  plantDepartureTime: string | null;
  siteArrivalTime: string | null;
  pourStartTime: string | null;
  pourEndTime: string | null;
  ambientTemperatureC: number | null;
  concreteTemperatureC: number | null;
  slump1Cm: number | null;
  slump2Cm: number | null;
  ticketStrengthKgCm2: number | null;
  ticketSlumpCm: number | null;
  ticketSlumpToleranceCm: number | null;
  ticketMaxAggregateMm: number | null;
  ticketCementType: Named | null;
  ticketDesignAgeDays: number | null;
  samples: SampleView[];
}

/** Header fields shared by the detail view and the PUT payload. */
interface HeaderFields {
  registrySequence: number | null;
  frontNumber: number;
  pourDate: string;
  production: ConcreteProduction | null;
  strengthCriterion: StrengthCriterion | null;
  specifiedStrengthKgCm2: number | null;
  specifiedSlumpCm: number | null;
  specifiedSlumpToleranceCm: number | null;
  maxAggregateSizeMm: number | null;
  designAgeDays: number | null;
  screened: boolean | null;
  screenMesh: string | null;
  skyCondition: SkyCondition | null;
  windCondition: WindCondition | null;
  lightingCondition: LightingCondition | null;
  relativeHumidityPct: number | null;
  thermometerCode: string | null;
  hygrometerCode: string | null;
  slumpConeCode: string | null;
  tapeMeasureCode: string | null;
  strikeOffBarCode: string | null;
  slumpRodCode: string | null;
  samplingRodCode: string | null;
  wheelbarrowCode: string | null;
  unitWeightScaleCode: string | null;
  unitWeightMoldCode: string | null;
  unitWeightTareG: number | null;
  unitWeightTareSampleG: number | null;
  unitWeightMoldFactor: number | null;
  airMeterCode: string | null;
  airContentPct: number | null;
  programmedElement: string | null;
  castElement: string | null;
  observations: string | null;
  samplerName: string | null;
  approvedByName: string | null;
}

export interface FieldRecordDetail extends HeaderFields {
  id: string;
  status: FieldRecordStatus;
  project: { id: string; name: string; code: string | null; client: Named };
  registryNumber: string | null;
  supplier: Named | null;
  cementType: Named | null;
  sheetCount: number;
  /** What still blocks completing the record (Q-33). */
  missingForCompletion: string[];
  deliveries: DeliveryView[];
  createdAt: string;
  updatedAt: string;
}

export interface NextNumbers {
  registrySequence: number;
  sampleNumber: number;
  specimenNumber: number;
}

export interface CreateFieldRecordInput {
  pourDate: string;
  registrySequence?: number;
  frontNumber?: number;
}

export interface FieldRecordListParams extends PaginationParams {
  q?: string;
  status?: FieldRecordStatus;
}

export interface SpecimenPayload {
  specimenNumber: number | null;
  moldCode: string | null;
}

export interface SamplePayload {
  sampleNumber: number | null;
  specimenType: SpecimenType | null;
  moldedAt: string | null;
  specimens: SpecimenPayload[];
}

export interface DeliveryPayload {
  ticketNumber: string | null;
  volumeM3: number | null;
  plantDepartureTime: string | null;
  siteArrivalTime: string | null;
  pourStartTime: string | null;
  pourEndTime: string | null;
  ambientTemperatureC: number | null;
  concreteTemperatureC: number | null;
  slump1Cm: number | null;
  slump2Cm: number | null;
  ticketStrengthKgCm2: number | null;
  ticketSlumpCm: number | null;
  ticketSlumpToleranceCm: number | null;
  ticketMaxAggregateMm: number | null;
  ticketCementTypeId: string | null;
  ticketDesignAgeDays: number | null;
  samples: SamplePayload[];
}

/** Body of PUT /field-records/:id (`FieldRecordFormDto`). */
export interface FieldRecordPayload extends HeaderFields {
  supplierId: string | null;
  cementTypeId: string | null;
  deliveries: DeliveryPayload[];
}
