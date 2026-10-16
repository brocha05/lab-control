/**
 * Compressive-strength calculations for cylinders, NMX-C-083-ONNCCE-2014, as confirmed
 * by the lab (questionnaire 2026-10-15: Q-26, Q-59, Q-61). Test vectors: the MCH-068
 * worksheets (FPC06-01), see compression.spec.ts.
 *
 * - Mean height / diameter: mean of the two readings, rounded to 0.1 cm.
 * - Area: π/4 × (rounded mean diameter)², rounded to 0.1 cm².
 * - Load in N: kgf × 9.81 (the press reads kgf), rounded to an integer.
 * - Stress: kgf ÷ area, rounded to 1 kgf/cm².
 * - MPa: stress ÷ 10.2, rounded to 0.1. ASSUMPTION A-77: from the unrounded stress (Q-80).
 * - % of design strength: ROUNDED stress ÷ f'c × 100, rounded to 0.1 (Q-59).
 * - Loading rate: rounded stress ÷ load time (s), 0.01 (kgf/cm²)/s.
 * - Per-age averages: mean of the rounded values, 0.1 (A-80, Q-80).
 * All rounding is half-up.
 */

export const KGF_TO_N = 9.81;
export const KGF_CM2_PER_MPA = 10.2;

/** Half-up rounding that isn't fooled by binary floats (15.05 → 15.1, not 15.0). */
export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(Number((value * factor).toPrecision(12))) / factor;
}

export interface CompressionReadings {
  height1Cm: number;
  height2Cm: number;
  diameter1Cm: number;
  diameter2Cm: number;
  maxLoadKgf: number;
  /** Only measured on 1 of every 10 specimens tested in a day (Q-63). */
  loadDurationS?: number | null;
}

export interface CompressionResult {
  meanHeightCm: number;
  meanDiameterCm: number;
  areaCm2: number;
  maxLoadN: number;
  stressKgCm2: number;
  stressMPa: number;
  percentOfDesign: number;
  /** null when the load time wasn't measured. */
  loadingRateKgCm2PerS: number | null;
}

export class InvalidReadingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReadingError';
  }
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new InvalidReadingError(`${label} must be a positive number, got ${value}`);
  }
}

export function computeCompression(
  readings: CompressionReadings,
  designStrengthKgCm2: number,
): CompressionResult {
  const { height1Cm, height2Cm, diameter1Cm, diameter2Cm, maxLoadKgf, loadDurationS } = readings;
  assertPositive(height1Cm, 'height1Cm');
  assertPositive(height2Cm, 'height2Cm');
  assertPositive(diameter1Cm, 'diameter1Cm');
  assertPositive(diameter2Cm, 'diameter2Cm');
  assertPositive(maxLoadKgf, 'maxLoadKgf');
  assertPositive(designStrengthKgCm2, 'designStrengthKgCm2');
  if (loadDurationS != null) assertPositive(loadDurationS, 'loadDurationS');

  const meanHeightCm = roundHalfUp((height1Cm + height2Cm) / 2, 1);
  const meanDiameterCm = roundHalfUp((diameter1Cm + diameter2Cm) / 2, 1);
  const areaCm2 = roundHalfUp((Math.PI / 4) * meanDiameterCm ** 2, 1);
  const rawStress = maxLoadKgf / areaCm2;
  const stressKgCm2 = roundHalfUp(rawStress, 0);

  return {
    meanHeightCm,
    meanDiameterCm,
    areaCm2,
    maxLoadN: roundHalfUp(maxLoadKgf * KGF_TO_N, 0),
    stressKgCm2,
    stressMPa: roundHalfUp(rawStress / KGF_CM2_PER_MPA, 1),
    percentOfDesign: roundHalfUp((stressKgCm2 / designStrengthKgCm2) * 100, 1),
    loadingRateKgCm2PerS:
      loadDurationS != null ? roundHalfUp(stressKgCm2 / loadDurationS, 2) : null,
  };
}

export interface AgeAverage {
  stressKgCm2: number;
  stressMPa: number;
  percentOfDesign: number;
}

/**
 * Result of one age: the average of its "sibling" specimens (usually two, Q-14),
 * computed from the rounded values.
 */
export function averageAtAge(results: readonly CompressionResult[]): AgeAverage {
  if (results.length === 0) {
    throw new InvalidReadingError('An age average needs at least one result');
  }
  const mean = (pick: (r: CompressionResult) => number) =>
    roundHalfUp(results.reduce((sum, r) => sum + pick(r), 0) / results.length, 1);
  return {
    stressKgCm2: mean((r) => r.stressKgCm2),
    stressMPa: mean((r) => r.stressMPa),
    percentOfDesign: mean((r) => r.percentOfDesign),
  };
}

/**
 * Unit weight (NMX-C-162-ONNCCE-2014 box of FPC01-01, Q-67):
 * material = (tare + sample) − tare; unit weight = material × mold factor.
 * Rounding is not specified; the caller formats it.
 */
export function unitWeight(tareG: number, tarePlusSampleG: number, moldFactor: number): number {
  assertPositive(moldFactor, 'moldFactor');
  const materialG = tarePlusSampleG - tareG;
  if (!(materialG > 0)) {
    throw new InvalidReadingError('tare + sample must be greater than the tare');
  }
  return materialG * moldFactor;
}
