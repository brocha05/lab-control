/**
 * Age tolerance of a compression test, NMX-C-083-ONNCCE-2014 as given by the lab
 * (questionnaire Q-62). The age is measured in hours from the molding time written on
 * the field record ("hora de elaboración"), or from the truck's arrival time when the
 * molding time is missing. A test outside the window is still recorded, and the
 * report notes it (Q-23).
 */
import { CalendarDate, daysBetween } from '../../shared/dates/calendar-date.js';
import { minutesOfDay, TimeOfDay } from '../../shared/dates/time-of-day.js';

/** Test age in days → allowed deviation in hours. 1 day = the standard's "24 h". */
const TOLERANCE_HOURS: ReadonlyMap<number, number> = new Map([
  [1, 0.5],
  [3, 2],
  [7, 6],
  [14, 12],
  [28, 20],
  [90, 48],
]);

/** null for an age the standard doesn't list (Q-84). */
export function ageToleranceHours(ageDays: number): number | null {
  return TOLERANCE_HOURS.get(ageDays) ?? null;
}

export interface AgeToleranceInput {
  ageDays: number;
  /** The record's pour date. */
  castDate: CalendarDate;
  /** Molding time; falls back to `siteArrivalTime`. */
  moldedAt: TimeOfDay | null;
  siteArrivalTime: TimeOfDay | null;
  testDate: CalendarDate;
  testTime: TimeOfDay;
}

export type AgeToleranceResult =
  | { status: 'WITHIN' | 'OUTSIDE'; actualHours: number; toleranceHours: number }
  /** No tolerance for this age, or no start time on the field record. */
  | { status: 'UNKNOWN'; actualHours: number | null; toleranceHours: number | null };

export function checkAgeTolerance(input: AgeToleranceInput): AgeToleranceResult {
  const toleranceHours = ageToleranceHours(input.ageDays);
  const start = input.moldedAt ?? input.siteArrivalTime;
  if (!start) return { status: 'UNKNOWN', actualHours: null, toleranceHours };

  const minutes =
    daysBetween(input.castDate, input.testDate) * 24 * 60 +
    minutesOfDay(input.testTime) -
    minutesOfDay(start);
  const actualHours = minutes / 60;
  if (toleranceHours === null) return { status: 'UNKNOWN', actualHours, toleranceHours };

  const deviation = Math.abs(actualHours - input.ageDays * 24);
  return {
    status: deviation <= toleranceHours ? 'WITHIN' : 'OUTSIDE',
    actualHours,
    toleranceHours,
  };
}
