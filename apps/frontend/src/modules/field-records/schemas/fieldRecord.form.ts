import type {
  DeliveryPayload,
  DeliveryView,
  FieldRecordDetail,
  FieldRecordPayload,
  SamplePayload,
  SampleView,
} from '../types/fieldRecord.types';

// The form keeps every input as a string ('' = empty) and converts once on save, so
// partially typed numbers never break the form. The backend validates everything.

export interface SpecimenValues {
  specimenNumber: string;
  moldCode: string;
}

export interface SampleValues {
  sampleNumber: string;
  specimenType: string;
  moldedAt: string;
  specimens: SpecimenValues[];
}

export interface DeliveryValues {
  ticketNumber: string;
  volumeM3: string;
  plantDepartureTime: string;
  siteArrivalTime: string;
  pourStartTime: string;
  pourEndTime: string;
  ambientTemperatureC: string;
  concreteTemperatureC: string;
  slump1Cm: string;
  slump2Cm: string;
  ticketStrengthKgCm2: string;
  ticketSlumpCm: string;
  ticketSlumpToleranceCm: string;
  ticketMaxAggregateMm: string;
  ticketCementTypeId: string;
  ticketDesignAgeDays: string;
  samples: SampleValues[];
}

export interface FieldRecordValues {
  registrySequence: string;
  frontNumber: string;
  pourDate: string;
  supplierId: string;
  production: string;
  strengthCriterion: string;
  specifiedStrengthKgCm2: string;
  specifiedSlumpCm: string;
  specifiedSlumpToleranceCm: string;
  maxAggregateSizeMm: string;
  cementTypeId: string;
  designAgeDays: string;
  /** '' | 'yes' | 'no' */
  screened: string;
  screenMesh: string;
  skyCondition: string;
  windCondition: string;
  lightingCondition: string;
  relativeHumidityPct: string;
  thermometerCode: string;
  hygrometerCode: string;
  slumpConeCode: string;
  tapeMeasureCode: string;
  strikeOffBarCode: string;
  slumpRodCode: string;
  samplingRodCode: string;
  wheelbarrowCode: string;
  unitWeightScaleCode: string;
  unitWeightMoldCode: string;
  unitWeightTareG: string;
  unitWeightTareSampleG: string;
  unitWeightMoldFactor: string;
  airMeterCode: string;
  airContentPct: string;
  programmedElement: string;
  castElement: string;
  observations: string;
  samplerName: string;
  approvedByName: string;
  deliveries: DeliveryValues[];
}

const s = (v: string | number | null | undefined): string =>
  v === null || v === undefined ? '' : String(v);
const text = (v: string): string | null => (v.trim() === '' ? null : v.trim());
const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));
const pick = <T extends string>(v: string): T | null => (v === '' ? null : (v as T));

export function emptySpecimen(specimenNumber = ''): SpecimenValues {
  return { specimenNumber, moldCode: '' };
}

export function emptySample(): SampleValues {
  return { sampleNumber: '', specimenType: 'CYLINDER_15X30', moldedAt: '', specimens: [] };
}

export function emptyDelivery(): DeliveryValues {
  return {
    ticketNumber: '',
    volumeM3: '',
    plantDepartureTime: '',
    siteArrivalTime: '',
    pourStartTime: '',
    pourEndTime: '',
    ambientTemperatureC: '',
    concreteTemperatureC: '',
    slump1Cm: '',
    slump2Cm: '',
    ticketStrengthKgCm2: '',
    ticketSlumpCm: '',
    ticketSlumpToleranceCm: '',
    ticketMaxAggregateMm: '',
    ticketCementTypeId: '',
    ticketDesignAgeDays: '',
    samples: [],
  };
}

function sampleValues(sample: SampleView): SampleValues {
  return {
    sampleNumber: s(sample.sampleNumber),
    specimenType: s(sample.specimenType),
    moldedAt: s(sample.moldedAt),
    specimens: sample.specimens.map((sp) => ({
      specimenNumber: s(sp.specimenNumber),
      moldCode: s(sp.moldCode),
    })),
  };
}

function deliveryValues(d: DeliveryView): DeliveryValues {
  return {
    ticketNumber: s(d.ticketNumber),
    volumeM3: s(d.volumeM3),
    plantDepartureTime: s(d.plantDepartureTime),
    siteArrivalTime: s(d.siteArrivalTime),
    pourStartTime: s(d.pourStartTime),
    pourEndTime: s(d.pourEndTime),
    ambientTemperatureC: s(d.ambientTemperatureC),
    concreteTemperatureC: s(d.concreteTemperatureC),
    slump1Cm: s(d.slump1Cm),
    slump2Cm: s(d.slump2Cm),
    ticketStrengthKgCm2: s(d.ticketStrengthKgCm2),
    ticketSlumpCm: s(d.ticketSlumpCm),
    ticketSlumpToleranceCm: s(d.ticketSlumpToleranceCm),
    ticketMaxAggregateMm: s(d.ticketMaxAggregateMm),
    ticketCementTypeId: s(d.ticketCementType?.id),
    ticketDesignAgeDays: s(d.ticketDesignAgeDays),
    samples: d.samples.map(sampleValues),
  };
}

export function toFormValues(r: FieldRecordDetail): FieldRecordValues {
  return {
    registrySequence: s(r.registrySequence),
    frontNumber: s(r.frontNumber),
    pourDate: r.pourDate,
    supplierId: s(r.supplier?.id),
    production: s(r.production),
    strengthCriterion: s(r.strengthCriterion),
    specifiedStrengthKgCm2: s(r.specifiedStrengthKgCm2),
    specifiedSlumpCm: s(r.specifiedSlumpCm),
    specifiedSlumpToleranceCm: s(r.specifiedSlumpToleranceCm),
    maxAggregateSizeMm: s(r.maxAggregateSizeMm),
    cementTypeId: s(r.cementType?.id),
    designAgeDays: s(r.designAgeDays),
    screened: r.screened === null ? '' : r.screened ? 'yes' : 'no',
    screenMesh: s(r.screenMesh),
    skyCondition: s(r.skyCondition),
    windCondition: s(r.windCondition),
    lightingCondition: s(r.lightingCondition),
    relativeHumidityPct: s(r.relativeHumidityPct),
    thermometerCode: s(r.thermometerCode),
    hygrometerCode: s(r.hygrometerCode),
    slumpConeCode: s(r.slumpConeCode),
    tapeMeasureCode: s(r.tapeMeasureCode),
    strikeOffBarCode: s(r.strikeOffBarCode),
    slumpRodCode: s(r.slumpRodCode),
    samplingRodCode: s(r.samplingRodCode),
    wheelbarrowCode: s(r.wheelbarrowCode),
    unitWeightScaleCode: s(r.unitWeightScaleCode),
    unitWeightMoldCode: s(r.unitWeightMoldCode),
    unitWeightTareG: s(r.unitWeightTareG),
    unitWeightTareSampleG: s(r.unitWeightTareSampleG),
    unitWeightMoldFactor: s(r.unitWeightMoldFactor),
    airMeterCode: s(r.airMeterCode),
    airContentPct: s(r.airContentPct),
    programmedElement: s(r.programmedElement),
    castElement: s(r.castElement),
    observations: s(r.observations),
    samplerName: s(r.samplerName),
    approvedByName: s(r.approvedByName),
    deliveries: r.deliveries.map(deliveryValues),
  };
}

function samplePayload(v: SampleValues): SamplePayload {
  return {
    sampleNumber: num(v.sampleNumber),
    specimenType: pick(v.specimenType),
    moldedAt: text(v.moldedAt),
    specimens: v.specimens.map((sp) => ({
      specimenNumber: num(sp.specimenNumber),
      moldCode: text(sp.moldCode),
    })),
  };
}

function deliveryPayload(v: DeliveryValues): DeliveryPayload {
  return {
    ticketNumber: text(v.ticketNumber),
    volumeM3: num(v.volumeM3),
    plantDepartureTime: text(v.plantDepartureTime),
    siteArrivalTime: text(v.siteArrivalTime),
    pourStartTime: text(v.pourStartTime),
    pourEndTime: text(v.pourEndTime),
    ambientTemperatureC: num(v.ambientTemperatureC),
    concreteTemperatureC: num(v.concreteTemperatureC),
    slump1Cm: num(v.slump1Cm),
    slump2Cm: num(v.slump2Cm),
    ticketStrengthKgCm2: num(v.ticketStrengthKgCm2),
    ticketSlumpCm: num(v.ticketSlumpCm),
    ticketSlumpToleranceCm: num(v.ticketSlumpToleranceCm),
    ticketMaxAggregateMm: num(v.ticketMaxAggregateMm),
    ticketCementTypeId: text(v.ticketCementTypeId),
    ticketDesignAgeDays: num(v.ticketDesignAgeDays),
    samples: v.samples.map(samplePayload),
  };
}

export function toPayload(v: FieldRecordValues): FieldRecordPayload {
  return {
    registrySequence: num(v.registrySequence),
    frontNumber: num(v.frontNumber) ?? 1,
    pourDate: v.pourDate,
    supplierId: text(v.supplierId),
    production: pick(v.production),
    strengthCriterion: pick(v.strengthCriterion),
    specifiedStrengthKgCm2: num(v.specifiedStrengthKgCm2),
    specifiedSlumpCm: num(v.specifiedSlumpCm),
    specifiedSlumpToleranceCm: num(v.specifiedSlumpToleranceCm),
    maxAggregateSizeMm: num(v.maxAggregateSizeMm),
    cementTypeId: text(v.cementTypeId),
    designAgeDays: num(v.designAgeDays),
    screened: v.screened === '' ? null : v.screened === 'yes',
    screenMesh: text(v.screenMesh),
    skyCondition: pick(v.skyCondition),
    windCondition: pick(v.windCondition),
    lightingCondition: pick(v.lightingCondition),
    relativeHumidityPct: num(v.relativeHumidityPct),
    thermometerCode: text(v.thermometerCode),
    hygrometerCode: text(v.hygrometerCode),
    slumpConeCode: text(v.slumpConeCode),
    tapeMeasureCode: text(v.tapeMeasureCode),
    strikeOffBarCode: text(v.strikeOffBarCode),
    slumpRodCode: text(v.slumpRodCode),
    samplingRodCode: text(v.samplingRodCode),
    wheelbarrowCode: text(v.wheelbarrowCode),
    unitWeightScaleCode: text(v.unitWeightScaleCode),
    unitWeightMoldCode: text(v.unitWeightMoldCode),
    unitWeightTareG: num(v.unitWeightTareG),
    unitWeightTareSampleG: num(v.unitWeightTareSampleG),
    unitWeightMoldFactor: num(v.unitWeightMoldFactor),
    airMeterCode: text(v.airMeterCode),
    airContentPct: num(v.airContentPct),
    programmedElement: text(v.programmedElement),
    castElement: text(v.castElement),
    observations: text(v.observations),
    samplerName: text(v.samplerName),
    approvedByName: text(v.approvedByName),
    deliveries: v.deliveries.map(deliveryPayload),
  };
}

/** Running "acumulado" for the deliveries being edited (unknown after a blank volume). */
export function cumulativeVolumes(deliveries: readonly DeliveryValues[]): (number | null)[] {
  let total: number | null = 0;
  return deliveries.map((d) => {
    const v = num(d.volumeM3);
    total =
      total === null || v === null || Number.isNaN(v) ? null : Math.round((total + v) * 100) / 100;
    return total;
  });
}
