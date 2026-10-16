// The FPC01-01 transcription split in steps, following the sheet's blocks.

export const STEPS = [
  { n: 1, label: 'Información general', description: 'Encabezado del registro y elementos.' },
  { n: 2, label: 'Concreto', description: 'Lo especificado en el proyecto para el elemento.' },
  {
    n: 3,
    label: 'Entregas y muestras',
    description: 'Un renglón por camión; las muestras y sus especímenes se capturan bajo cada uno.',
  },
  {
    n: 4,
    label: 'Condiciones y equipo',
    description: 'Condiciones ambientales, equipo usado y pruebas opcionales.',
  },
  { n: 5, label: 'Confirmación', description: 'Revisa, firma y completa el registro.' },
] as const;

export type StepNumber = (typeof STEPS)[number]['n'];

const STEP_OF_FIELD: Record<string, StepNumber> = {
  registrySequence: 1,
  supplier: 1,
  programmedElement: 1,
  castElement: 1,
  samplerName: 1,
  strengthCriterion: 2,
  specifiedStrengthKgCm2: 2,
  specifiedSlumpCm: 2,
  specifiedSlumpToleranceCm: 2,
  maxAggregateSizeMm: 2,
  cementType: 2,
  designAgeDays: 2,
  screened: 2,
  deliveries: 3,
  samples: 3,
  skyCondition: 4,
  windCondition: 4,
  lightingCondition: 4,
  approvedByName: 5,
};

/** Step where a `missingForCompletion` path is filled in. */
export function stepOfMissing(path: string): StepNumber {
  if (path.startsWith('deliveries[')) return 3;
  if (path.endsWith('Code')) return 4;
  return STEP_OF_FIELD[path] ?? 5;
}
