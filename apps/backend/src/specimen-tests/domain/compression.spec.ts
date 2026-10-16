import {
  averageAtAge,
  computeCompression,
  InvalidReadingError,
  roundHalfUp,
  unitWeight,
} from './compression.js';

/**
 * Test vectors: the lab's own worksheets for registro MCH-068 and the zapata of the
 * same project (FPC06-01, 05/09/2026 and 09/09/2026), f'c = 250 kgf/cm². The % for 406
 * is 84.8: the issued report printed 84.6, which the lab confirmed was wrong (Q-59).
 */
const FC = 250;

const worksheet = [
  // specimen, h1, h2, d1, d2, kgf, seconds | expected: h̄, d̄, area, N, kgf/cm², MPa, %, rate
  { id: 389, r: [30.0, 30.0, 15.0, 14.9, 37330], e: [30.0, 15.0, 176.7, 366207, 211, null, 84.4] },
  { id: 390, r: [29.9, 29.9, 15.0, 15.0, 37970], e: [29.9, 15.0, 176.7, 372486, 215, null, 86.0] },
  { id: 393, r: [29.9, 29.9, 15.0, 15.0, 40400], e: [29.9, 15.0, 176.7, 396324, 229, null, 91.6] },
  { id: 394, r: [29.8, 29.8, 15.0, 15.0, 39250], e: [29.8, 15.0, 176.7, 385043, 222, null, 88.8] },
  { id: 405, r: [29.7, 29.8, 14.9, 14.9, 36470], e: [29.8, 14.9, 174.4, 357771, 209, 20.5, 83.6] },
  { id: 406, r: [30.0, 30.0, 15.1, 15.0, 37900], e: [30.0, 15.1, 179.1, 371799, 212, 20.7, 84.8] },
  { id: 407, r: [30.0, 30.0, 15.0, 14.9, 53120], e: [30.0, 15.0, 176.7, 521107, 301, 29.5, 120.4] },
  { id: 408, r: [29.9, 30.0, 15.0, 15.0, 53490], e: [30.0, 15.0, 176.7, 524737, 303, 29.7, 121.2] },
] as const;

function compute(r: readonly number[], loadDurationS: number | null = null) {
  const [height1Cm, height2Cm, diameter1Cm, diameter2Cm, maxLoadKgf] = r;
  return computeCompression(
    { height1Cm, height2Cm, diameter1Cm, diameter2Cm, maxLoadKgf, loadDurationS },
    FC,
  );
}

describe('roundHalfUp', () => {
  it.each([
    [15.05, 1, 15.1],
    [29.75, 1, 29.8],
    [29.95, 1, 30.0],
    [385042.5, 0, 385043],
    [84.65, 1, 84.7],
    [2.6403, 2, 2.64],
  ])('%f to %i decimals → %f', (value, decimals, expected) => {
    expect(roundHalfUp(value, decimals)).toBe(expected);
  });
});

describe('computeCompression (NMX-C-083, lab worksheets)', () => {
  it.each(worksheet)('specimen $id', ({ r, e }) => {
    const [meanHeightCm, meanDiameterCm, areaCm2, maxLoadN, stressKgCm2, stressMPa, percent] = e;
    const result = compute(r);
    expect(result).toMatchObject({
      meanHeightCm,
      meanDiameterCm,
      areaCm2,
      maxLoadN,
      stressKgCm2,
      percentOfDesign: percent,
      loadingRateKgCm2PerS: null,
    });
    if (stressMPa !== null) expect(result.stressMPa).toBe(stressMPa);
  });

  it('computes the loading rate when the load time was measured (407: 114 s → 2.64)', () => {
    expect(compute(worksheet[6].r, 114).loadingRateKgCm2PerS).toBe(2.64);
  });

  it('uses the rounded stress for the % of design strength (Q-59)', () => {
    // 37 900 / 179.1 = 211.6 → 212 → 84.8 %, not 211.6 / 250 = 84.6 %.
    expect(compute(worksheet[5].r).percentOfDesign).toBe(84.8);
  });

  it.each([
    [{ height1Cm: 0 }, 'height1Cm'],
    [{ maxLoadKgf: -1 }, 'maxLoadKgf'],
    [{ diameter2Cm: Number.NaN }, 'diameter2Cm'],
    [{ loadDurationS: 0 }, 'loadDurationS'],
  ])('rejects %o', (override, label) => {
    const readings = {
      height1Cm: 30,
      height2Cm: 30,
      diameter1Cm: 15,
      diameter2Cm: 15,
      maxLoadKgf: 50000,
      ...override,
    };
    expect(() => computeCompression(readings, FC)).toThrow(label);
  });

  it('rejects a missing design strength', () => {
    expect(() =>
      computeCompression(
        { height1Cm: 30, height2Cm: 30, diameter1Cm: 15, diameter2Cm: 15, maxLoadKgf: 1 },
        0,
      ),
    ).toThrow(InvalidReadingError);
  });
});

describe('averageAtAge (A-80)', () => {
  it('averages the rounded values of the sibling specimens (MCH-068)', () => {
    const at3 = averageAtAge([compute(worksheet[4].r), compute(worksheet[5].r)]);
    expect(at3).toEqual({ stressKgCm2: 210.5, stressMPa: 20.6, percentOfDesign: 84.2 });

    const at7 = averageAtAge([compute(worksheet[6].r), compute(worksheet[7].r)]);
    expect(at7).toEqual({ stressKgCm2: 302, stressMPa: 29.6, percentOfDesign: 120.8 });
  });

  it('needs at least one result', () => {
    expect(() => averageAtAge([])).toThrow(InvalidReadingError);
  });
});

describe('unitWeight (Q-67)', () => {
  it('is (tare + sample − tare) × mold factor', () => {
    expect(unitWeight(2500, 14000, 0.2)).toBe(2300);
  });

  it('rejects a sample lighter than the tare', () => {
    expect(() => unitWeight(2500, 2400, 0.2)).toThrow(InvalidReadingError);
  });
});
