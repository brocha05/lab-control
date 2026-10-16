import apiClient from '@/lib/api/client';
import type { PaginatedResponse } from '@/types';
import type {
  CreateFieldRecordInput,
  FieldRecordDetail,
  FieldRecordListParams,
  FieldRecordPayload,
  FieldRecordSummary,
  NextNumbers,
} from '../types/fieldRecord.types';

// Endpoints: docs/api/endpoints.md (field records)
export const fieldRecordsApi = {
  list: (projectId: string, params: FieldRecordListParams) =>
    apiClient.get<PaginatedResponse<FieldRecordSummary>>(`/projects/${projectId}/field-records`, {
      params,
    }),

  nextNumbers: (projectId: string) =>
    apiClient.get<NextNumbers>(`/projects/${projectId}/field-records/next-numbers`),

  create: (projectId: string, data: CreateFieldRecordInput) =>
    apiClient.post<FieldRecordDetail>(`/projects/${projectId}/field-records`, data),

  get: (id: string) => apiClient.get<FieldRecordDetail>(`/field-records/${id}`),

  save: (id: string, data: FieldRecordPayload) =>
    apiClient.put<FieldRecordDetail>(`/field-records/${id}`, data),

  complete: (id: string) => apiClient.post<FieldRecordDetail>(`/field-records/${id}/complete`),

  cancel: (id: string) => apiClient.post<FieldRecordDetail>(`/field-records/${id}/cancel`),
};
