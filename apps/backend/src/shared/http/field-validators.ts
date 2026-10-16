import { applyDecorators } from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TrimToNull } from './transforms.js';

/** Optional, nullable measurement with at most `decimals` decimals (numeric(p, s)). */
export const OptionalDecimal = (decimals: number, opts: { min?: number; max?: number } = {}) =>
  applyDecorators(
    IsOptional(),
    IsNumber({ maxDecimalPlaces: decimals, allowNaN: false, allowInfinity: false }),
    ...(opts.min !== undefined ? [Min(opts.min)] : []),
    ...(opts.max !== undefined ? [Max(opts.max)] : []),
  );

/** Optional, nullable integer within a range. */
export const OptionalInt = (min: number, max: number) =>
  applyDecorators(IsOptional(), IsInt(), Min(min), Max(max));

/** Optional, nullable free text, trimmed ("" becomes null). */
export const OptionalText = (maxLength: number) =>
  applyDecorators(TrimToNull(), IsOptional(), IsString(), MaxLength(maxLength));

/** Optional, nullable clock time `HH:MM` (24 h). */
export const OptionalTime = () =>
  applyDecorators(
    IsOptional(),
    Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: '$property must be HH:MM (24 h)' }),
  );

/** Date-only `YYYY-MM-DD`; the service still rejects impossible dates (2026-02-30). */
export const DateOnly = () =>
  applyDecorators(Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property must be YYYY-MM-DD' }));

export const OptionalEnum = (entity: object) => applyDecorators(IsOptional(), IsEnum(entity));
export const OptionalUuid = () => applyDecorators(IsOptional(), IsUUID());
export const OptionalBoolean = () => applyDecorators(IsOptional(), IsBoolean());
