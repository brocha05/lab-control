import { Transform } from 'class-transformer';

/** Trims strings; leaves other values for the validators to reject. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/**
 * For optional text fields: trims, and turns "" into null so a PATCH can clear the field
 * by sending either "" or null.
 */
export const TrimToNull = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
