import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

/** 3–4 letters, stored uppercase (report-number segments, Q-56). */
export const RECORD_CODE = /^[A-ZÑ]{3,4}$/;

/** Trims and uppercases, then requires 3–4 letters. Combine with @IsOptional() on PATCH. */
export const RecordCode = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toUpperCase() : value,
    ),
    Matches(RECORD_CODE, { message: '$property must be 3 or 4 letters' }),
  );
