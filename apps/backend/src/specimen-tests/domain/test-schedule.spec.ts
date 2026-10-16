import { parseCalendarDate } from '../../shared/dates/calendar-date.js';
import {
  assignSpecimensToAges,
  classifyDueStatus,
  InvalidTestAgeRuleError,
  nextWorkingDay,
  planTestAges,
  scheduledTestDate,
  specimenAgeInDays,
} from './test-schedule.js';

const d = parseCalendarDate;

describe('scheduledTestDate', () => {
  it('adds the configured age to the reference date (A-11)', () => {
    expect(scheduledTestDate(d('2026-10-02'), 7)).toBe('2026-10-09');
  });

  it('reproduces MCH-068: pour 2026-09-02, tested 09-05 (a Saturday, not moved) and 09-09', () => {
    expect(scheduledTestDate(d('2026-09-02'), 3)).toBe('2026-09-05');
    expect(scheduledTestDate(d('2026-09-02'), 7)).toBe('2026-09-09');
  });

  it('moves a Sunday to Monday (Q-21: 3 days on a Sunday → tested at 4 days)', () => {
    expect(scheduledTestDate(d('2026-09-03'), 3)).toBe('2026-09-07');
  });

  it('skips holidays, also right after a Sunday', () => {
    const holidays = new Set(['2026-09-16', '2026-11-16']);
    const isHoliday = (date: string) => holidays.has(date);
    expect(scheduledTestDate(d('2026-09-09'), 7, { isHoliday })).toBe('2026-09-17');
    expect(scheduledTestDate(d('2026-11-08'), 7, { isHoliday })).toBe('2026-11-17');
  });

  it('keeps the exact date when the client requires it', () => {
    expect(scheduledTestDate(d('2026-09-03'), 3, { keepExactDate: true })).toBe('2026-09-06');
  });

  it.each([0, -7, 2.5, Number.NaN])('rejects ageDays = %p', (age) => {
    expect(() => scheduledTestDate(d('2026-10-02'), age)).toThrow(InvalidTestAgeRuleError);
  });
});

describe('planTestAges', () => {
  it('reproduces the example in docs/architecture/data-flow.md', () => {
    // Ages are configuration, not constants: this is only the documented example.
    const plan = planTestAges(d('2026-10-02'), [
      { ageDays: 28, specimenCount: 3 },
      { ageDays: 7, specimenCount: 2 },
    ]);

    expect(plan).toEqual([
      { ageDays: 7, specimenCount: 2, scheduledDate: '2026-10-09' },
      { ageDays: 28, specimenCount: 3, scheduledDate: '2026-10-30' },
    ]);
  });

  it('works with any configured ages', () => {
    const plan = planTestAges(d('2026-12-30'), [{ ageDays: 3, specimenCount: 1 }]);
    expect(plan).toEqual([{ ageDays: 3, specimenCount: 1, scheduledDate: '2027-01-02' }]);
  });

  it('returns an empty plan for an empty configuration', () => {
    expect(planTestAges(d('2026-10-02'), [])).toEqual([]);
  });

  it('rejects duplicate ages', () => {
    expect(() =>
      planTestAges(d('2026-10-02'), [
        { ageDays: 7, specimenCount: 1 },
        { ageDays: 7, specimenCount: 2 },
      ]),
    ).toThrow('Duplicate test age: 7 days');
  });

  it('rejects non-positive specimen counts', () => {
    expect(() => planTestAges(d('2026-10-02'), [{ ageDays: 7, specimenCount: 0 }])).toThrow(
      InvalidTestAgeRuleError,
    );
  });

  it('does not mutate the input', () => {
    const rules = [
      { ageDays: 28, specimenCount: 3 },
      { ageDays: 7, specimenCount: 2 },
    ];
    planTestAges(d('2026-10-02'), rules);
    expect(rules[0].ageDays).toBe(28);
  });
});

describe('nextWorkingDay', () => {
  it('returns the same day when it is a working day', () => {
    expect(nextWorkingDay(d('2026-09-05'))).toBe('2026-09-05');
  });

  it('fails on a calendar where every day is a holiday', () => {
    expect(() => nextWorkingDay(d('2026-01-01'), () => true)).toThrow(RangeError);
  });
});

describe('assignSpecimensToAges (Q-14)', () => {
  it('reproduces MCH-068: 405–406 at 3 days, 407–408 at 7 days', () => {
    const rules = [
      { ageDays: 7, specimenCount: 2 },
      { ageDays: 3, specimenCount: 2 },
    ];
    expect(assignSpecimensToAges([407, 405, 408, 406], rules)).toEqual([
      { specimenNumber: 405, ageDays: 3 },
      { specimenNumber: 406, ageDays: 3 },
      { specimenNumber: 407, ageDays: 7 },
      { specimenNumber: 408, ageDays: 7 },
    ]);
  });

  it('handles uneven splits such as 1 at 7, 1 at 14 and 2 at 28 days', () => {
    const rules = [
      { ageDays: 28, specimenCount: 2 },
      { ageDays: 7, specimenCount: 1 },
      { ageDays: 14, specimenCount: 1 },
    ];
    expect(assignSpecimensToAges([10, 11, 12, 13], rules).map((a) => a.ageDays)).toEqual([
      7, 14, 28, 28,
    ]);
  });

  it('rejects a sample whose specimen count does not match the plan', () => {
    expect(() => assignSpecimensToAges([1, 2, 3], [{ ageDays: 7, specimenCount: 4 }])).toThrow(
      'The plan needs 4 specimens, the sample has 3',
    );
  });
});

describe('specimenAgeInDays', () => {
  it('derives the actual age on a date', () => {
    expect(specimenAgeInDays(d('2026-10-02'), d('2026-10-10'))).toBe(8);
  });
});

describe('classifyDueStatus', () => {
  const today = d('2026-10-09');

  it.each([
    ['2026-10-08', 'OVERDUE'],
    ['2026-10-09', 'DUE_TODAY'],
    ['2026-10-10', 'UPCOMING'],
  ] as const)('%s → %s', (scheduled, expected) => {
    expect(classifyDueStatus(d(scheduled), today)).toBe(expected);
  });
});
