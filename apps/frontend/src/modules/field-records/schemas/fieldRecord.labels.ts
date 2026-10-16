import type {
  ConcreteProduction,
  FieldRecordStatus,
  LightingCondition,
  SkyCondition,
  SpecimenType,
  StrengthCriterion,
  WindCondition,
} from '../types/fieldRecord.types';

// Spanish labels as printed on FPC01-01 (A-40).

export const STATUS_LABELS: Record<FieldRecordStatus, string> = {
  DRAFT: 'Borrador',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const PRODUCTION_LABELS: Record<ConcreteProduction, string> = {
  READY_MIXED: 'Premezclado',
  SITE_MIXED: 'Hecho en obra',
};

export const STRENGTH_LABELS: Record<StrengthCriterion, string> = {
  FC: "f'c",
  MR: 'MR',
};

export const SKY_LABELS: Record<SkyCondition, string> = {
  SUNNY: 'Soleado',
  CLOUDY: 'Nublado',
  RAINY: 'Lluvioso',
};

export const WIND_LABELS: Record<WindCondition, string> = {
  WINDY: 'Ventisca',
  CALM: 'Calma',
};

export const LIGHTING_LABELS: Record<LightingCondition, string> = {
  NATURAL: 'Luz natural',
  ARTIFICIAL: 'Iluminación artificial',
};

export const SPECIMEN_TYPE_LABELS: Record<SpecimenType, string> = {
  CYLINDER_15X30: 'Cilindro 15×30',
  CYLINDER_10X20: 'Cilindro 10×20',
  BEAM_15X60: 'Viga 15×60',
  BEAM_15X50: 'Viga 15×50',
  CUBE_15: 'Cubo 15',
  CUBE_10: 'Cubo 10',
};

const FIELD_LABELS: Record<string, string> = {
  registrySequence: 'Número de registro',
  supplier: 'Proveedor',
  strengthCriterion: "f'c / MR",
  specifiedStrengthKgCm2: 'Resistencia de proyecto',
  specifiedSlumpCm: 'Revenimiento de proyecto',
  specifiedSlumpToleranceCm: 'Tolerancia del revenimiento',
  maxAggregateSizeMm: 'Tamaño máximo del agregado',
  cementType: 'Tipo de cemento',
  designAgeDays: 'Edad definitiva',
  screened: 'Cribado',
  skyCondition: 'Cielo',
  windCondition: 'Viento',
  lightingCondition: 'Iluminación',
  slumpConeCode: 'Cono de revenimiento',
  tapeMeasureCode: 'Flexómetro',
  strikeOffBarCode: 'Enrasador',
  slumpRodCode: 'Varilla de revenimiento',
  samplingRodCode: 'Varilla de muestreo',
  wheelbarrowCode: 'Carretilla',
  programmedElement: 'Elemento programado',
  castElement: 'Elemento colado',
  samplerName: 'Muestreador',
  approvedByName: 'Visto bueno',
  deliveries: 'Al menos una entrega',
  samples: 'Al menos una muestra',
  ticketNumber: 'remisión',
  volumeM3: 'volumen',
  plantDepartureTime: 'salida de planta',
  siteArrivalTime: 'llegada a obra',
  pourStartTime: 'inicio del colado',
  pourEndTime: 'término del colado',
  ambientTemperatureC: 'temperatura ambiente',
  concreteTemperatureC: 'temperatura del concreto',
  slump1Cm: 'revenimiento',
  sampleNumber: 'número de muestra',
  moldedAt: 'hora de elaboración',
  specimens: 'especímenes',
  specimenNumber: 'número de espécimen',
  moldCode: 'clave de molde',
};

/**
 * "deliveries[2].samples[1].moldedAt" → "Entrega 2, muestra 1: hora de elaboración".
 * Paths come from the backend's `missingForCompletion` (1-based, Q-33).
 */
export function describeMissing(path: string): string {
  const parts = path.split('.');
  const where: string[] = [];
  let field = path;
  for (const part of parts) {
    const m = /^(\w+)\[(\d+)\]$/.exec(part);
    if (m) {
      const noun = { deliveries: 'Entrega', samples: 'muestra', specimens: 'espécimen' }[m[1]];
      where.push(`${noun ?? m[1]} ${m[2]}`);
    } else {
      field = part;
    }
  }
  const label = FIELD_LABELS[field] ?? field;
  return where.length ? `${where.join(', ')}: ${label}` : label;
}
