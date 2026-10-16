import { countPendingTests } from './summary.js';

describe('countPendingTests', () => {
  it('counts by due status and by project', () => {
    const t = (dueStatus: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING', id: string) => ({
      dueStatus,
      project: { id },
    });
    expect(
      countPendingTests([
        t('OVERDUE', 'p1'),
        t('DUE_TODAY', 'p1'),
        t('UPCOMING', 'p2'),
        t('UPCOMING', 'p1'),
      ]),
    ).toEqual({
      overdue: 1,
      dueToday: 1,
      upcoming: 2,
      byProject: [
        { projectId: 'p1', count: 3 },
        { projectId: 'p2', count: 1 },
      ],
    });
  });

  it('is all zeros for an empty list', () => {
    expect(countPendingTests([])).toEqual({ overdue: 0, dueToday: 0, upcoming: 0, byProject: [] });
  });
});
