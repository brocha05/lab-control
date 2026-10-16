import type {
  CementType,
  ConcreteProduction,
  ConcreteSupplier,
  Delivery,
  FieldRecord,
  FieldRecordStatus,
  LightingCondition,
  Sample,
  SkyCondition,
  Specimen,
  SpecimenStatus,
  SpecimenType,
  StrengthCriterion,
  WindCondition,
} from '../generated/prisma/client.js';
import { CalendarDate, calendarDateFromDb } from '../shared/dates/calendar-date.js';
import type { SpecimenTestBrief } from '../specimen-tests/specimen-tests.service.js';
import { TimeOfDay, timeOfDayFromDb } from '../shared/dates/time-of-day.js';
import { missingForCompletion } from './domain/completeness.js';
import { formatRegistryNumber, sheetCount, sheetOfDelivery } from './domain/numbering.js';

// API shapes of a field record (FPC01-01). Decimals are numbers, dates `YYYY-MM-DD`,
// times `HH:MM`. Derived values (registro label, sheets, cumulative volume) are
// computed here, never stored.

type Named = { id: string; name: string };

export interface FieldRecordSummary {
  id: string;
  status: FieldRecordStatus;
  registrySequence: number | null;
  /** "MCH-068" (Q-55). */
  registryNumber: string | null;
  frontNumber: number;
  pourDate: CalendarDate;
  castElement: string | null;
  deliveryCount: number;
  sampleCount: number;
  specimenCount: number;
}

export interface SpecimenView {
  id: string;
  status: SpecimenStatus;
  specimenNumber: number | null;
  moldCode: string | null;
  /** The specimen's current (non-cancelled) test, planned when the record is completed. */
  test: Omit<SpecimenTestBrief, 'specimenId'> | null;
}

export interface SampleView {
  id: string;
  sampleNumber: number | null;
  specimenType: SpecimenType | null;
  moldedAt: TimeOfDay | null;
  specimens: SpecimenView[];
}

export interface DeliveryView {
  id: string;
  sequence: number;
  /** Paper sheet this delivery is printed on (7 per sheet, Q-71). */
  sheet: number;
  ticketNumber: string | null;
  volumeM3: number | null;
  /** Running sum of the volumes up to this delivery ("acumulado"). */
  cumulativeVolumeM3: number | null;
  plantDepartureTime: TimeOfDay | null;
  siteArrivalTime: TimeOfDay | null;
  pourStartTime: TimeOfDay | null;
  pourEndTime: TimeOfDay | null;
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

export interface FieldRecordDetail {
  id: string;
  status: FieldRecordStatus;
  project: { id: string; name: string; code: string | null; client: Named };
  registrySequence: number | null;
  registryNumber: string | null;
  frontNumber: number;
  pourDate: CalendarDate;
  supplier: Named | null;
  production: ConcreteProduction | null;
  strengthCriterion: StrengthCriterion | null;
  specifiedStrengthKgCm2: number | null;
  specifiedSlumpCm: number | null;
  specifiedSlumpToleranceCm: number | null;
  maxAggregateSizeMm: number | null;
  cementType: Named | null;
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
  /** "Hoja _ de _": sheets the paper record needs. */
  sheetCount: number;
  /** What still blocks `complete()` (Q-33); empty when it can be completed. */
  missingForCompletion: string[];
  deliveries: DeliveryView[];
  createdAt: Date;
  updatedAt: Date;
}

type Dec = { toNumber(): number } | null;
const num = (d: Dec): number | null => (d === null ? null : d.toNumber());
const tod = (t: Date | null): TimeOfDay | null => (t === null ? null : timeOfDayFromDb(t));
const registryLabel = (seq: number | null) => (seq === null ? null : formatRegistryNumber(seq));

type SummaryRow = FieldRecord & {
  deliveries: { samples: { _count: { specimens: number } }[] }[];
};

export function toSummary(r: SummaryRow): FieldRecordSummary {
  const samples = r.deliveries.flatMap((d) => d.samples);
  return {
    id: r.id,
    status: r.status,
    registrySequence: r.registrySequence,
    registryNumber: registryLabel(r.registrySequence),
    frontNumber: r.frontNumber,
    pourDate: calendarDateFromDb(r.pourDate),
    castElement: r.castElement,
    deliveryCount: r.deliveries.length,
    sampleCount: samples.length,
    specimenCount: samples.reduce((sum, s) => sum + s._count.specimens, 0),
  };
}

type DetailRow = FieldRecord & {
  supplier: Pick<ConcreteSupplier, 'id' | 'name'> | null;
  cementType: Pick<CementType, 'id' | 'name'> | null;
  deliveries: (Delivery & {
    ticketCementType: Pick<CementType, 'id' | 'name'> | null;
    samples: (Sample & { specimens: Specimen[] })[];
  })[];
};

export function toDetail(
  r: DetailRow,
  project: FieldRecordDetail['project'],
  tests: readonly SpecimenTestBrief[] = [],
): FieldRecordDetail {
  const testBySpecimen = new Map(
    tests.filter((t) => t.status !== 'CANCELLED').map(({ specimenId, ...t }) => [specimenId, t]),
  );
  let cumulative: number | null = 0;
  const deliveries = r.deliveries.map((d): DeliveryView => {
    const volume = num(d.volumeM3);
    // One missing volume makes every later "acumulado" unknown.
    cumulative = cumulative === null || volume === null ? null : round2(cumulative + volume);
    return {
      id: d.id,
      sequence: d.sequence,
      sheet: sheetOfDelivery(d.sequence),
      ticketNumber: d.ticketNumber,
      volumeM3: volume,
      cumulativeVolumeM3: cumulative,
      plantDepartureTime: tod(d.plantDepartureTime),
      siteArrivalTime: tod(d.siteArrivalTime),
      pourStartTime: tod(d.pourStartTime),
      pourEndTime: tod(d.pourEndTime),
      ambientTemperatureC: num(d.ambientTemperatureC),
      concreteTemperatureC: num(d.concreteTemperatureC),
      slump1Cm: num(d.slump1Cm),
      slump2Cm: num(d.slump2Cm),
      ticketStrengthKgCm2: num(d.ticketStrengthKgCm2),
      ticketSlumpCm: num(d.ticketSlumpCm),
      ticketSlumpToleranceCm: num(d.ticketSlumpToleranceCm),
      ticketMaxAggregateMm: num(d.ticketMaxAggregateMm),
      ticketCementType: d.ticketCementType,
      ticketDesignAgeDays: d.ticketDesignAgeDays,
      samples: d.samples.map((s) => ({
        id: s.id,
        sampleNumber: s.sampleNumber,
        specimenType: s.specimenType,
        moldedAt: tod(s.moldedAt),
        specimens: s.specimens.map((sp) => ({
          id: sp.id,
          status: sp.status,
          specimenNumber: sp.specimenNumber,
          moldCode: sp.moldCode,
          test: testBySpecimen.get(sp.id) ?? null,
        })),
      })),
    };
  });

  const detail: Omit<FieldRecordDetail, 'missingForCompletion'> = {
    id: r.id,
    status: r.status,
    project,
    registrySequence: r.registrySequence,
    registryNumber: registryLabel(r.registrySequence),
    frontNumber: r.frontNumber,
    pourDate: calendarDateFromDb(r.pourDate),
    supplier: r.supplier,
    production: r.production,
    strengthCriterion: r.strengthCriterion,
    specifiedStrengthKgCm2: num(r.specifiedStrengthKgCm2),
    specifiedSlumpCm: num(r.specifiedSlumpCm),
    specifiedSlumpToleranceCm: num(r.specifiedSlumpToleranceCm),
    maxAggregateSizeMm: num(r.maxAggregateSizeMm),
    cementType: r.cementType,
    designAgeDays: r.designAgeDays,
    screened: r.screened,
    screenMesh: r.screenMesh,
    skyCondition: r.skyCondition,
    windCondition: r.windCondition,
    lightingCondition: r.lightingCondition,
    relativeHumidityPct: num(r.relativeHumidityPct),
    thermometerCode: r.thermometerCode,
    hygrometerCode: r.hygrometerCode,
    slumpConeCode: r.slumpConeCode,
    tapeMeasureCode: r.tapeMeasureCode,
    strikeOffBarCode: r.strikeOffBarCode,
    slumpRodCode: r.slumpRodCode,
    samplingRodCode: r.samplingRodCode,
    wheelbarrowCode: r.wheelbarrowCode,
    unitWeightScaleCode: r.unitWeightScaleCode,
    unitWeightMoldCode: r.unitWeightMoldCode,
    unitWeightTareG: num(r.unitWeightTareG),
    unitWeightTareSampleG: num(r.unitWeightTareSampleG),
    unitWeightMoldFactor: num(r.unitWeightMoldFactor),
    airMeterCode: r.airMeterCode,
    airContentPct: num(r.airContentPct),
    programmedElement: r.programmedElement,
    castElement: r.castElement,
    observations: r.observations,
    samplerName: r.samplerName,
    approvedByName: r.approvedByName,
    sheetCount: sheetCount(deliveries.length),
    deliveries,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
  return { ...detail, missingForCompletion: missingForCompletion(detail) };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
