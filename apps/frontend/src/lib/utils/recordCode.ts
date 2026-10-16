import { z } from 'zod';

/**
 * Client/project code: 3–4 letters, a segment of the report number (Q-56). Mirrors
 * apps/backend/src/shared/http/record-code.ts. Uppercased before validation.
 */
export const recordCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-ZÑ]{3,4}$/, 'Usa 3 o 4 letras');
