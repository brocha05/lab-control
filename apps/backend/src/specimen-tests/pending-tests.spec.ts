import { parseCalendarDate } from '../shared/dates/calendar-date.js';
import { buildPendingList, type PendingCandidate } from './pending-tests.js';

const d = parseCalendarDate;

function candidate(
  over: Partial<PendingCandidate> & { pourDate?: string; specimenNumber?: number },
): PendingCandidate {
  return {
    id: `t-${over.specimenNumber ?? 1}`,
    status: 'SCHEDULED',
    ageDays: 3,
    keepExactDate: false,
    specimen: { id: 's', specimenNumber: over.specimenNumber ?? 1, moldCode: null },
    sample: { sampleNumber: 102, moldedAt: null },
    fieldRecord: {
      id: 'r',
      registrySequence: 68,
      pourDate: d(over.pourDate ?? '2026-09-02'),
      castElement: null,
    },
    project: { id: 'p', name: 'Puente', code: 'PVLT' },
    ...over,
  };
}

describe('buildPendingList', () => {
  const noHolidays = () => false;

  it('derives the dates and due status (MCH-068 seen on 2026-09-05)', () => {
    const list = buildPendingList(
      [
        candidate({ specimenNumber: 407, ageDays: 7 }),
        candidate({ specimenNumber: 405, ageDays: 3 }),
      ],
      d('2026-09-05'),
      d('2026-09-30'),
      noHolidays,
    );
    expect(list.map((t) => [t.specimen.specimenNumber, t.scheduledDate, t.dueStatus])).toEqual([
      [405, '2026-09-05', 'DUE_TODAY'],
      [407, '2026-09-09', 'UPCOMING'],
    ]);
    expect(list[0].fieldRecord.registryNumber).toBe('MCH-068');
  });

  it('moves Sundays and holidays, unless the test keeps its exact date (Q-21)', () => {
    const list = buildPendingList(
      [
        candidate({ specimenNumber: 1, pourDate: '2026-09-03' }), // nominal Sunday 09-06
        candidate({ specimenNumber: 2, pourDate: '2026-09-03', keepExactDate: true }),
        candidate({ specimenNumber: 3, pourDate: '2026-09-13' }), // nominal 09-16, holiday
      ],
      d('2026-09-01'),
      d('2026-09-30'),
      (date) => date === '2026-09-16',
    );
    expect(list.map((t) => [t.specimen.specimenNumber, t.nominalDate, t.scheduledDate])).toEqual([
      [2, '2026-09-06', '2026-09-06'],
      [1, '2026-09-06', '2026-09-07'],
      [3, '2026-09-16', '2026-09-17'],
    ]);
  });

  it('keeps overdue tests and drops those scheduled after `until`', () => {
    const list = buildPendingList(
      [
        candidate({ specimenNumber: 1, ageDays: 3 }), // 09-05
        candidate({ specimenNumber: 2, ageDays: 28 }), // 09-30
      ],
      d('2026-09-10'),
      d('2026-09-20'),
      noHolidays,
    );
    expect(list.map((t) => [t.specimen.specimenNumber, t.dueStatus])).toEqual([[1, 'OVERDUE']]);
  });
});
