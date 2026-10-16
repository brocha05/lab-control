/**
 * What a field record needs before it can be COMPLETED (questionnaire Q-33): every
 * field filled in on the lab's example record (MCH-068), with the "visto bueno"
 * (Q-73). Fields left blank on that example stay optional: thermometer and
 * hygrometer codes, humidity, unit weight, air content, the delivery-ticket values,
 * the second slump reading, observations and the specimen type.
 */

type Value = string | number | boolean | null | undefined | { id: string };

export interface CompletenessSpecimen {
  specimenNumber: number | null;
  moldCode: string | null;
}

export interface CompletenessSample {
  sampleNumber: number | null;
  moldedAt: string | null;
  specimens: CompletenessSpecimen[];
}

export interface CompletenessDelivery {
  ticketNumber: string | null;
  volumeM3: number | null;
  plantDepartureTime: string | null;
  siteArrivalTime: string | null;
  pourStartTime: string | null;
  pourEndTime: string | null;
  ambientTemperatureC: number | null;
  concreteTemperatureC: number | null;
  slump1Cm: number | null;
  samples: CompletenessSample[];
}

export interface CompletenessRecord {
  registrySequence: number | null;
  supplier: { id: string } | null;
  strengthCriterion: string | null;
  specifiedStrengthKgCm2: number | null;
  specifiedSlumpCm: number | null;
  specifiedSlumpToleranceCm: number | null;
  maxAggregateSizeMm: number | null;
  cementType: { id: string } | null;
  designAgeDays: number | null;
  screened: boolean | null;
  skyCondition: string | null;
  windCondition: string | null;
  lightingCondition: string | null;
  slumpConeCode: string | null;
  tapeMeasureCode: string | null;
  strikeOffBarCode: string | null;
  slumpRodCode: string | null;
  samplingRodCode: string | null;
  wheelbarrowCode: string | null;
  programmedElement: string | null;
  castElement: string | null;
  samplerName: string | null;
  approvedByName: string | null;
  deliveries: CompletenessDelivery[];
}

const RECORD_FIELDS = [
  'registrySequence',
  'supplier',
  'strengthCriterion',
  'specifiedStrengthKgCm2',
  'specifiedSlumpCm',
  'specifiedSlumpToleranceCm',
  'maxAggregateSizeMm',
  'cementType',
  'designAgeDays',
  'screened',
  'skyCondition',
  'windCondition',
  'lightingCondition',
  'slumpConeCode',
  'tapeMeasureCode',
  'strikeOffBarCode',
  'slumpRodCode',
  'samplingRodCode',
  'wheelbarrowCode',
  'programmedElement',
  'castElement',
  'samplerName',
  'approvedByName',
] as const satisfies readonly (keyof CompletenessRecord)[];

const DELIVERY_FIELDS = [
  'ticketNumber',
  'volumeM3',
  'plantDepartureTime',
  'siteArrivalTime',
  'pourStartTime',
  'pourEndTime',
  'ambientTemperatureC',
  'concreteTemperatureC',
  'slump1Cm',
] as const satisfies readonly (keyof CompletenessDelivery)[];

const missing = (v: Value) => v === null || v === undefined || v === '';

/**
 * Paths of the missing items, e.g. `castElement`, `deliveries[2].pourEndTime`,
 * `deliveries[1].samples[0].specimens[3].moldCode`, `samples` (no sample at all).
 * Empty when the record can be completed. Indexes are 1-based like the paper form.
 */
export function missingForCompletion(record: CompletenessRecord): string[] {
  const out: string[] = RECORD_FIELDS.filter((f) => missing(record[f]));

  if (record.deliveries.length === 0) out.push('deliveries');
  record.deliveries.forEach((d, i) => {
    const at = `deliveries[${i + 1}]`;
    for (const f of DELIVERY_FIELDS) if (missing(d[f])) out.push(`${at}.${f}`);
    d.samples.forEach((s, j) => {
      const sAt = `${at}.samples[${j + 1}]`;
      if (missing(s.sampleNumber)) out.push(`${sAt}.sampleNumber`);
      if (missing(s.moldedAt)) out.push(`${sAt}.moldedAt`);
      if (s.specimens.length === 0) out.push(`${sAt}.specimens`);
      s.specimens.forEach((sp, k) => {
        if (missing(sp.specimenNumber)) out.push(`${sAt}.specimens[${k + 1}].specimenNumber`);
        if (missing(sp.moldCode)) out.push(`${sAt}.specimens[${k + 1}].moldCode`);
      });
    });
  });

  // Specimens are what gets tested: a record without any sample can't be completed.
  if (record.deliveries.length > 0 && record.deliveries.every((d) => d.samples.length === 0)) {
    out.push('samples');
  }
  return out;
}
