/**
 * FieldRecord transitions (docs/domain/lifecycle.md). The only place that decides
 * which status changes are allowed.
 *
 *   DRAFT ── complete() ──▶ COMPLETED   (the signed paper is fully transcribed, Q-33/Q-73)
 *     └──── cancel() ────▶ CANCELLED
 */
export type FieldRecordStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: FieldRecordStatus,
    readonly to: FieldRecordStatus,
  ) {
    super(`A ${from} field record can't become ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

const ALLOWED: Readonly<Record<FieldRecordStatus, readonly FieldRecordStatus[]>> = {
  DRAFT: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertFieldRecordTransition(from: FieldRecordStatus, to: FieldRecordStatus): void {
  if (!ALLOWED[from].includes(to)) throw new InvalidTransitionError(from, to);
}
