import apiClient from '@/lib/api/client';

/** `DashboardSummary` in apps/backend/src/dashboard/dashboard.service.ts (8.4). */
export interface DashboardSummary {
  today: string;
  until: string;
  clients: number;
  projects: number;
  tests: {
    overdue: number;
    dueToday: number;
    upcoming: number;
    byProject: { projectId: string; count: number }[];
  };
  draftFieldRecords: number;
  pendingReports: number;
}

export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
};
