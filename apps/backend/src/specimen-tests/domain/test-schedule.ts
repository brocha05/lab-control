/**
 * Pure test-scheduling logic. No domain constants: ages come from configuration
 * (ProjectTestConfiguration, ASSUMPTION A-10). See docs/architecture/data-flow.md §2.
 *
 * ASSUMPTION A-11: scheduled date = reference date + ageDays.
 * ASSUMPTION A-12: the reference date is the FieldRecord date (Q-18).
 * ASSUMPTION A-13: calendar days, no weekend/holiday shifting (Q-21).
 */
import {
  addDays,
  CalendarDate,
  compareCalendarDates,
  daysBetween,
} from '../../shared/dates/calendar-date.js';

export interface TestAgeRule {
  readonly ageDays: number;
  readonly specimenCount: number;
}

export interface PlannedTestAge extends TestAgeRule {
  readonly scheduledDate: CalendarDate;
}

export type DueStatus = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

export class InvalidTestAgeRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTestAgeRuleError';
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvalidTestAgeRuleError(`${label} must be a positive integer, got ${value}`);
  }
}

export function scheduledTestDate(referenceDate: CalendarDate, ageDays: number): CalendarDate {
  assertPositiveInteger(ageDays, 'ageDays');
  return addDays(referenceDate, ageDays);
}

/** Age in days on a given date (e.g. the actual age when the test was performed). */
export function specimenAgeInDays(referenceDate: CalendarDate, onDate: CalendarDate): number {
  return daysBetween(referenceDate, onDate);
}

/**
 * Per configured age: the scheduled date and how many specimens are needed.
 * How the record's specimens are assigned to ages is NOT decided here (Q-13, Q-14, Q-16).
 */
export function planTestAges(
  referenceDate: CalendarDate,
  rules: readonly TestAgeRule[],
): PlannedTestAge[] {
  const seen = new Set<number>();
  for (const rule of rules) {
    assertPositiveInteger(rule.ageDays, 'ageDays');
    assertPositiveInteger(rule.specimenCount, 'specimenCount');
    if (seen.has(rule.ageDays)) {
      throw new InvalidTestAgeRuleError(`Duplicate test age: ${rule.ageDays} days`);
    }
    seen.add(rule.ageDays);
  }

  return [...rules]
    .sort((a, b) => a.ageDays - b.ageDays)
    .map((rule) => ({
      ageDays: rule.ageDays,
      specimenCount: rule.specimenCount,
      scheduledDate: scheduledTestDate(referenceDate, rule.ageDays),
    }));
}

/** `today` must be computed in the tenant's timezone (ASSUMPTION A-14). */
export function classifyDueStatus(scheduledDate: CalendarDate, today: CalendarDate): DueStatus {
  const cmp = compareCalendarDates(scheduledDate, today);
  if (cmp < 0) return 'OVERDUE';
  if (cmp === 0) return 'DUE_TODAY';
  return 'UPCOMING';
}
