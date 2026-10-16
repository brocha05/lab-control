import {
  duplicateNumbers,
  formatRegistryNumber,
  nextNumber,
  sheetCount,
  sheetOfDelivery,
} from './numbering.js';

describe('formatRegistryNumber (Q-55)', () => {
  it.each([
    [68, 'MCH-068'],
    [1, 'MCH-001'],
    [1234, 'MCH-1234'],
  ])('%i → %s', (n, expected) => {
    expect(formatRegistryNumber(n)).toBe(expected);
  });

  it.each([0, -1, 1.5])('rejects %p', (n) => {
    expect(() => formatRegistryNumber(n)).toThrow(RangeError);
  });
});

describe('sheets (Q-71, Q-77)', () => {
  it('puts 7 deliveries per sheet', () => {
    expect([1, 7, 8, 9, 14, 15].map(sheetOfDelivery)).toEqual([1, 1, 2, 2, 2, 3]);
  });

  it('needs at least one sheet', () => {
    expect([0, 4, 7, 9].map(sheetCount)).toEqual([1, 1, 1, 2]);
  });
});

describe('nextNumber', () => {
  it('starts at 1 and follows the highest number', () => {
    expect(nextNumber(null)).toBe(1);
    expect(nextNumber(408)).toBe(409);
  });
});

describe('duplicateNumbers', () => {
  it('lists repeated numbers and ignores missing ones', () => {
    expect(duplicateNumbers([405, 406, null, 405, undefined, 407, 406, 405])).toEqual([405, 406]);
    expect(duplicateNumbers([1, 2, 3])).toEqual([]);
  });
});
