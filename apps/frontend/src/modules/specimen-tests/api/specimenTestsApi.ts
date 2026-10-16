import apiClient from '@/lib/api/client';
import type { PendingTest, PendingTestsParams, RescheduleInput } from '../types/specimenTest.types';

// Endpoints: docs/api/endpoints.md (tests)
export const specimenTestsApi = {
  pending: (params: PendingTestsParams) =>
    apiClient.get<PendingTest[]>('/tests/pending', { params }),

  reschedule: (id: string, data: RescheduleInput) =>
    apiClient.patch<unknown>(`/tests/${id}/schedule`, data),

  cancelSpecimen: (specimenId: string) =>
    apiClient.post<unknown>(`/specimens/${specimenId}/cancel`),
};
