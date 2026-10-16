import type { DueStatus } from '../../specimen-tests/domain/test-schedule.js';

export interface TestCounts {
  overdue: number;
  dueToday: number;
  upcoming: number;
  /** Open tests in the window per project, for the projects table. */
  byProject: { projectId: string; count: number }[];
}

/** Pure: counts the pending list (already cut at the window's end) by due status. */
export function countPendingTests(
  tests: readonly { dueStatus: DueStatus; project: { id: string } }[],
): TestCounts {
  const counts = { OVERDUE: 0, DUE_TODAY: 0, UPCOMING: 0 };
  const byProject = new Map<string, number>();
  for (const t of tests) {
    counts[t.dueStatus] += 1;
    byProject.set(t.project.id, (byProject.get(t.project.id) ?? 0) + 1);
  }
  return {
    overdue: counts.OVERDUE,
    dueToday: counts.DUE_TODAY,
    upcoming: counts.UPCOMING,
    byProject: [...byProject].map(([projectId, count]) => ({ projectId, count })),
  };
}
