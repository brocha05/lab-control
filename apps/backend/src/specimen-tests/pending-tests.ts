import { formatRegistryNumber } from '../field-records/domain/numbering.js';
import { addDays, CalendarDate, compareCalendarDates } from '../shared/dates/calendar-date.js';
import { TimeOfDay } from '../shared/dates/time-of-day.js';
import { classifyDueStatus, DueStatus, scheduledTestDate } from './domain/test-schedule.js';

/** One row of the pending-tests list (development-plan 6.5). */
export interface PendingTest {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS';
  ageDays: number;
  keepExactDate: boolean;
  /** Pour date + age, before any Sunday/holiday shift. */
  nominalDate: CalendarDate;
  /** The day to test: moved past Sundays and holidays unless keepExactDate (Q-21). */
  scheduledDate: CalendarDate;
  dueStatus: DueStatus;
  specimen: { id: string; specimenNumber: number | null; moldCode: string | null };
  sample: { sampleNumber: number | null; moldedAt: TimeOfDay | null };
  fieldRecord: {
    id: string;
    registryNumber: string | null;
    pourDate: CalendarDate;
    castElement: string | null;
  };
  project: { id: string; name: string; code: string | null };
}

export interface PendingCandidate extends Omit<
  PendingTest,
  'nominalDate' | 'scheduledDate' | 'dueStatus' | 'fieldRecord'
> {
  fieldRecord: Omit<PendingTest['fieldRecord'], 'registryNumber'> & {
    registrySequence: number | null;
  };
}

/**
 * Pure: derives dates and due status, keeps the tests scheduled up to `until`, and
 * sorts them by date, project and specimen number.
 */
export function buildPendingList(
  candidates: readonly PendingCandidate[],
  today: CalendarDate,
  until: CalendarDate,
  isHoliday: (date: CalendarDate) => boolean,
): PendingTest[] {
  return candidates
    .map((c): PendingTest => {
      const nominalDate = addDays(c.fieldRecord.pourDate, c.ageDays);
      const scheduledDate = scheduledTestDate(c.fieldRecord.pourDate, c.ageDays, {
        isHoliday,
        keepExactDate: c.keepExactDate,
      });
      const { registrySequence, ...record } = c.fieldRecord;
      return {
        ...c,
        nominalDate,
        scheduledDate,
        dueStatus: classifyDueStatus(scheduledDate, today),
        fieldRecord: {
          ...record,
          registryNumber: registrySequence === null ? null : formatRegistryNumber(registrySequence),
        },
      };
    })
    .filter((t) => compareCalendarDates(t.scheduledDate, until) <= 0)
    .sort(
      (a, b) =>
        compareCalendarDates(a.scheduledDate, b.scheduledDate) ||
        (a.project.code ?? a.project.name).localeCompare(b.project.code ?? b.project.name) ||
        (a.specimen.specimenNumber ?? 0) - (b.specimen.specimenNumber ?? 0),
    );
}
