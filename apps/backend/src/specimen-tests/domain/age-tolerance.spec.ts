import { parseCalendarDate } from '../../shared/dates/calendar-date.js';
import { parseTimeOfDay } from '../../shared/dates/time-of-day.js';
import { ageToleranceHours, checkAgeTolerance } from './age-tolerance.js';

const d = parseCalendarDate;
const t = parseTimeOfDay;

describe('ageToleranceHours (NMX-C-083, Q-62)', () => {
  it.each([
    [1, 0.5],
    [3, 2],
    [7, 6],
    [14, 12],
    [28, 20],
    [90, 48],
  ])('%i days → ±%f h', (age, hours) => {
    expect(ageToleranceHours(age)).toBe(hours);
  });

  it('has no tolerance for an age the standard does not list (Q-84)', () => {
    expect(ageToleranceHours(56)).toBeNull();
  });
});

describe('checkAgeTolerance', () => {
  // MCH-068: molded 2026-09-02 at 10:30, 3-day test on 09-05.
  const base = {
    ageDays: 3,
    castDate: d('2026-09-02'),
    moldedAt: t('10:30'),
    siteArrivalTime: t('10:15'),
    testDate: d('2026-09-05'),
  };

  it('is within ±2 h for a 3-day test at 11:30', () => {
    expect(checkAgeTolerance({ ...base, testTime: t('11:30') })).toEqual({
      status: 'WITHIN',
      actualHours: 73,
      toleranceHours: 2,
    });
  });

  it('accepts the exact edge of the window', () => {
    expect(checkAgeTolerance({ ...base, testTime: t('08:30') }).status).toBe('WITHIN');
    expect(checkAgeTolerance({ ...base, testTime: t('12:31') }).status).toBe('OUTSIDE');
  });

  it('is outside when a Sunday shift turns 3 days into 4', () => {
    const result = checkAgeTolerance({ ...base, testDate: d('2026-09-06'), testTime: t('10:30') });
    expect(result).toMatchObject({ status: 'OUTSIDE', actualHours: 96 });
  });

  it('falls back to the site arrival time when the molding time is missing', () => {
    const result = checkAgeTolerance({ ...base, moldedAt: null, testTime: t('10:15') });
    expect(result).toMatchObject({ status: 'WITHIN', actualHours: 72 });
  });

  it('is unknown without any start time, or for an unlisted age', () => {
    expect(
      checkAgeTolerance({ ...base, moldedAt: null, siteArrivalTime: null, testTime: t('10:30') }),
    ).toEqual({ status: 'UNKNOWN', actualHours: null, toleranceHours: 2 });
    expect(
      checkAgeTolerance({ ...base, ageDays: 56, testDate: d('2026-10-28'), testTime: t('10:30') }),
    ).toEqual({ status: 'UNKNOWN', actualHours: 56 * 24, toleranceHours: null });
  });
});
