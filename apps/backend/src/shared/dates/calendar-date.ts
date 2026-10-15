/**
 * Date-only domain values (`YYYY-MM-DD`), stored as Postgres `DATE`.
 * See docs/architecture/overview.md (Dates) and ASSUMPTION A-14.
 *
 * Arithmetic is done on UTC midnights so it never depends on the server timezone.
 * "Today" must always come from `calendarDateInTimeZone(tenant.timezone)`.
 */
export type CalendarDate = string & { readonly __brand: 'CalendarDate' };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export class InvalidCalendarDateError extends Error {
  constructor(value: string) {
    super(`Invalid calendar date "${value}" (expected YYYY-MM-DD)`);
    this.name = 'InvalidCalendarDateError';
  }
}

export function parseCalendarDate(value: string): CalendarDate {
  const match = ISO_DATE.exec(value);
  if (!match) throw new InvalidCalendarDateError(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  // Rejects overflow such as 2026-02-30.
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new InvalidCalendarDateError(value);
  }
  return value as CalendarDate;
}

function toUtcMs(date: CalendarDate): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function fromUtcMs(ms: number): CalendarDate {
  return new Date(ms).toISOString().slice(0, 10) as CalendarDate;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  if (!Number.isInteger(days)) {
    throw new RangeError(`days must be an integer, got ${days}`);
  }
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The calendar date of `now` in an IANA timezone (e.g. the tenant's). */
export function calendarDateInTimeZone(timeZone: string, now: Date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return parseCalendarDate(`${get('year')}-${get('month')}-${get('day')}`);
}

/** Prisma returns `@db.Date` columns as a JS Date at UTC midnight. */
export function calendarDateFromDb(value: Date): CalendarDate {
  return fromUtcMs(value.getTime());
}

export function calendarDateToDb(date: CalendarDate): Date {
  return new Date(toUtcMs(date));
}
