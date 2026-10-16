/**
 * Lab numbers of a field record (questionnaire 2026-10-15). Pure functions.
 *
 * - Registro: "MCH-" + consecutive per project, at least 3 digits (Q-55). MCH =
 *   Muestreo de Concreto Hidráulico.
 * - Muestra / espécimen: plain consecutive numbers per project (Q-57, Q-58).
 * - Sheets: the paper form holds 7 deliveries per sheet (Q-71, Q-77).
 */

export const REGISTRY_PREFIX = 'MCH';
export const DELIVERIES_PER_SHEET = 7;

/** 68 → "MCH-068"; 1234 → "MCH-1234". */
export function formatRegistryNumber(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new RangeError(`registry sequence must be a positive integer, got ${sequence}`);
  }
  return `${REGISTRY_PREFIX}-${String(sequence).padStart(3, '0')}`;
}

/** Sheet ("Hoja _ de _") a delivery is printed on. */
export function sheetOfDelivery(sequence: number): number {
  return Math.ceil(sequence / DELIVERIES_PER_SHEET);
}

/** Number of sheets the paper record needs (at least one). */
export function sheetCount(deliveryCount: number): number {
  return Math.max(1, Math.ceil(deliveryCount / DELIVERIES_PER_SHEET));
}

/** Next consecutive number after the highest one in use (1 when none). */
export function nextNumber(highest: number | null): number {
  return (highest ?? 0) + 1;
}

/** Numbers that appear more than once (ignores missing ones), ascending. */
export function duplicateNumbers(numbers: readonly (number | null | undefined)[]): number[] {
  const seen = new Set<number>();
  const dup = new Set<number>();
  for (const n of numbers) {
    if (n == null) continue;
    if (seen.has(n)) dup.add(n);
    seen.add(n);
  }
  return [...dup].sort((a, b) => a - b);
}
