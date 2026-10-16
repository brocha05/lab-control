import apiClient from '@/lib/api/client';
import type { RecordReports, Report, ReportFields } from '../types/report.types';

// Endpoints: docs/api/endpoints.md (reports)
export const reportsApi = {
  list: (projectId?: string) =>
    apiClient.get<Report[]>('/reports', { params: projectId ? { projectId } : {} }),

  forRecord: (fieldRecordId: string) =>
    apiClient.get<RecordReports>(`/field-records/${fieldRecordId}/reports`),

  create: (fieldRecordId: string, fields: Partial<ReportFields>) =>
    apiClient.post<Report>(`/field-records/${fieldRecordId}/reports`, fields),

  update: (id: string, fields: Partial<ReportFields>) =>
    apiClient.patch<Report>(`/reports/${id}`, fields),

  generate: (id: string) => apiClient.post<Report>(`/reports/${id}/generate`),

  finalize: (id: string) => apiClient.post<Report>(`/reports/${id}/finalize`),

  pdf: (id: string) => apiClient.get<Blob>(`/reports/${id}/pdf`, { responseType: 'blob' }),
};
