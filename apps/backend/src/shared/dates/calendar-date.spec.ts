import {
  addDays,
  calendarDateFromDb,
  calendarDateInTimeZone,
  calendarDateToDb,
  compareCalendarDates,
  dayOfWeek,
  daysBetween,
  InvalidCalendarDateError,
  parseCalendarDate,
} from './calendar-date.js';

const d = parseCalendarDate;

describe('parseCalendarDate', () => {
  it('accepts valid YYYY-MM-DD dates', () => {
    expect(d('2026-10-02')).toBe('2026-10-02');
    expect(d('2028-02-29')).toBe('2028-02-29'); // leap year
  });

  it.each([
    '2026-02-30',
    '2026-13-01',
    '2027-02-29',
    '2026-1-01',
    '02/10/2026',
    '',
    '2026-10-02T00:00',
  ])('rejects %p', (value) => {
    expect(() => d(value)).toThrow(InvalidCalendarDateError);
  });
});

describe('addDays', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays(d('2026-10-02'), 7)).toBe('2026-10-09');
    expect(addDays(d('2026-10-02'), 28)).toBe('2026-10-30');
    expect(addDays(d('2026-12-20'), 28)).toBe('2027-01-17');
    expect(addDays(d('2028-02-28'), 1)).toBe('2028-02-29');
  });

  it('is not affected by DST transitions', () => {
    // Mexico and the US change clocks around these dates; arithmetic is on UTC midnights.
    expect(addDays(d('2026-03-07'), 2)).toBe('2026-03-09');
    expect(addDays(d('2026-10-31'), 2)).toBe('2026-11-02');
  });

  it('supports negative offsets and rejects non-integers', () => {
    expect(addDays(d('2026-10-02'), -2)).toBe('2026-09-30');
    expect(() => addDays(d('2026-10-02'), 1.5)).toThrow(RangeError);
  });
});

describe('daysBetween / compareCalendarDates', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween(d('2026-10-02'), d('2026-10-30'))).toBe(28);
    expect(daysBetween(d('2026-10-30'), d('2026-10-02'))).toBe(-28);
    expect(daysBetween(d('2026-10-02'), d('2026-10-02'))).toBe(0);
  });

  it('orders dates', () => {
    expect(compareCalendarDates(d('2026-10-01'), d('2026-10-02'))).toBe(-1);
    expect(compareCalendarDates(d('2026-10-02'), d('2026-10-02'))).toBe(0);
    expect(compareCalendarDates(d('2026-11-01'), d('2026-10-31'))).toBe(1);
  });
});

describe('calendarDateInTimeZone', () => {
  it('returns the local date of the given instant in the tenant timezone', () => {
    // 2026-10-03T03:30Z is still Oct 2 in Mexico City (UTC-6).
    const instant = new Date('2026-10-03T03:30:00Z');
    expect(calendarDateInTimeZone('America/Mexico_City', instant)).toBe('2026-10-02');
    expect(calendarDateInTimeZone('UTC', instant)).toBe('2026-10-03');
  });
});

describe('DB conversion', () => {
  it('round-trips through a UTC-midnight Date', () => {
    const date = d('2026-10-02');
    const db = calendarDateToDb(date);
    expect(db.toISOString()).toBe('2026-10-02T00:00:00.000Z');
    expect(calendarDateFromDb(db)).toBe(date);
  });
});

describe('dayOfWeek', () => {
  it.each([
    ['2026-09-02', 3], // Wednesday: MCH-068 pour date
    ['2026-09-05', 6], // Saturday: its 3-day test (Saturdays are working days, Q-21)
    ['2026-09-06', 0], // Sunday
  ] as const)('%s → %i', (date, expected) => {
    expect(dayOfWeek(d(date))).toBe(expected);
  });
});
