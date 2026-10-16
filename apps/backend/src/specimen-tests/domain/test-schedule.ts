/**
 * Pure test-scheduling logic. No domain constants: ages come from configuration
 * (the project's default ages, editable per test: Q-20, Q-22). See
 * docs/architecture/data-flow.md §2.
 *
 * A-11 (confirmed, FPC06-04): nominal date = reference date + ageDays.
 * A-12 (confirmed, FPC06-04): the reference date is the record's "fecha del colado"
 * (FieldRecord.pourDate).
 * Q-21 (A-13 rejected): a date that falls on a Sunday or a holiday moves to the next
 * day that is neither, unless the client requires the exact age. Saturdays are working
 * days. Which holidays apply is the lab's calendar (Q-81, A-78).
 * Q-14: specimens go to ages in ascending order of their numbers.
 */
import {
  addDays,
  CalendarDate,
  compareCalendarDates,
  dayOfWeek,
  daysBetween,
} from '../../shared/dates/calendar-date.js';

export interface TestAgeRule {
  readonly ageDays: number;
  readonly specimenCount: number;
}

export interface PlannedTestAge extends TestAgeRule {
  readonly scheduledDate: CalendarDate;
}

export interface ScheduleOptions {
  /** The lab's holidays. Without it only Sundays move a date. */
  readonly isHoliday?: (date: CalendarDate) => boolean;
  /** The client requires the exact age, even on a Sunday or holiday (Q-21). */
  readonly keepExactDate?: boolean;
}

export type DueStatus = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

export class InvalidTestAgeRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTestAgeRuleError';
  }
}

const SUNDAY = 0;
/** A year of consecutive holidays would mean a broken calendar, not a schedule. */
const MAX_SHIFT_DAYS = 366;

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvalidTestAgeRuleError(`${label} must be a positive integer, got ${value}`);
  }
}

/** The first day from `date` on that is neither a Sunday nor a holiday. */
export function nextWorkingDay(
  date: CalendarDate,
  isHoliday: (date: CalendarDate) => boolean = () => false,
): CalendarDate {
  let day = date;
  for (let i = 0; i <= MAX_SHIFT_DAYS; i++) {
    if (dayOfWeek(day) !== SUNDAY && !isHoliday(day)) return day;
    day = addDays(day, 1);
  }
  throw new RangeError(`No working day within ${MAX_SHIFT_DAYS} days of ${date}`);
}

export function scheduledTestDate(
  referenceDate: CalendarDate,
  ageDays: number,
  options: ScheduleOptions = {},
): CalendarDate {
  assertPositiveInteger(ageDays, 'ageDays');
  const nominal = addDays(referenceDate, ageDays);
  return options.keepExactDate ? nominal : nextWorkingDay(nominal, options.isHoliday);
}

/** Age in days on a given date (e.g. the actual age when the test was performed). */
export function specimenAgeInDays(referenceDate: CalendarDate, onDate: CalendarDate): number {
  return daysBetween(referenceDate, onDate);
}

/** Per configured age, sorted ascending: the scheduled date and how many specimens. */
export function planTestAges(
  referenceDate: CalendarDate,
  rules: readonly TestAgeRule[],
  options: Omit<ScheduleOptions, 'keepExactDate'> = {},
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
      scheduledDate: scheduledTestDate(referenceDate, rule.ageDays, options),
    }));
}

/**
 * Q-14: in ascending order of specimen number, the first `specimenCount` specimens go
 * to the first age, the next ones to the second age, and so on.
 * ASSUMPTION A-82: when a sample has more specimens than the plan, the extra ones go to
 * the last age; with fewer, the last ages get fewer. The user then adjusts single
 * tests (Q-22). Throws only when there are no ages at all.
 */
export function assignSpecimensToAges(
  specimenNumbers: readonly number[],
  rules: readonly TestAgeRule[],
): { specimenNumber: number; ageDays: number }[] {
  if (rules.length === 0) {
    throw new InvalidTestAgeRuleError('No test ages configured');
  }
  const sortedNumbers = [...specimenNumbers].sort((a, b) => a - b);
  const sortedRules = [...rules].sort((a, b) => a.ageDays - b.ageDays);
  const ages = sortedRules.flatMap((r) => Array<number>(r.specimenCount).fill(r.ageDays));
  const lastAge = sortedRules[sortedRules.length - 1].ageDays;
  return sortedNumbers.map((specimenNumber, i) => ({
    specimenNumber,
    ageDays: ages[i] ?? lastAge,
  }));
}

/** `today` must be computed in the tenant's timezone (ASSUMPTION A-14). */
export function classifyDueStatus(scheduledDate: CalendarDate, today: CalendarDate): DueStatus {
  const cmp = compareCalendarDates(scheduledDate, today);
  if (cmp < 0) return 'OVERDUE';
  if (cmp === 0) return 'DUE_TODAY';
  return 'UPCOMING';
}
