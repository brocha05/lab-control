import apiClient from '@/lib/api/client';
import type {
  PendingTest,
  PendingTestsParams,
  RescheduleInput,
  SaveTestResultsInput,
  Worksheet,
} from '../types/specimenTest.types';

// Endpoints: docs/api/endpoints.md (tests)
export const specimenTestsApi = {
  pending: (params: PendingTestsParams) =>
    apiClient.get<PendingTest[]>('/tests/pending', { params }),

  reschedule: (id: string, data: RescheduleInput) =>
    apiClient.patch<unknown>(`/tests/${id}/schedule`, data),

  worksheet: (projectId: string, testDate: string) =>
    apiClient.get<Worksheet>('/tests/worksheet', { params: { projectId, testDate } }),

  saveResults: (data: SaveTestResultsInput) =>
    apiClient.put<{ saved: number }>('/tests/results', data),

  cancelSpecimen: (specimenId: string) =>
    apiClient.post<unknown>(`/specimens/${specimenId}/cancel`),
};
