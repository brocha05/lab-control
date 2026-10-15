import { parseCalendarDate } from '../../shared/dates/calendar-date.js';
import {
  classifyDueStatus,
  InvalidTestAgeRuleError,
  planTestAges,
  scheduledTestDate,
  specimenAgeInDays,
} from './test-schedule.js';

const d = parseCalendarDate;

describe('scheduledTestDate', () => {
  it('adds the configured age to the reference date (A-11)', () => {
    expect(scheduledTestDate(d('2026-10-02'), 7)).toBe('2026-10-09');
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
