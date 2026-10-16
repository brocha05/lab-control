'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

/** Home-screen counts; always refetched on visit since any change elsewhere moves them. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await dashboardApi.summary()).data,
    staleTime: 0,
  });
}
