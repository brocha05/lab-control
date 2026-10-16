import { assertFieldRecordTransition, InvalidTransitionError } from './lifecycle.js';

describe('assertFieldRecordTransition', () => {
  it.each([
    ['DRAFT', 'COMPLETED'],
    ['DRAFT', 'CANCELLED'],
  ] as const)('allows %s → %s', (from, to) => {
    expect(() => assertFieldRecordTransition(from, to)).not.toThrow();
  });

  it.each([
    ['COMPLETED', 'CANCELLED'],
    ['COMPLETED', 'DRAFT'],
    ['CANCELLED', 'COMPLETED'],
    ['CANCELLED', 'DRAFT'],
    ['DRAFT', 'DRAFT'],
  ] as const)('rejects %s → %s', (from, to) => {
    expect(() => assertFieldRecordTransition(from, to)).toThrow(InvalidTransitionError);
  });
});
