import apiClient from '@/lib/api/client';
import type { Bitacora, BitacoraParams } from '../types/bitacora.types';

// Endpoints: docs/api/endpoints.md (bitácora)
export const bitacoraApi = {
  forProject: (projectId: string, params: BitacoraParams) =>
    apiClient.get<Bitacora>(`/projects/${projectId}/bitacora`, { params }),

  /** Excel workbook: one project, or every project with a tab each. */
  export: (projectId?: string) =>
    apiClient.get<Blob>('/bitacora/export', {
      params: projectId ? { projectId } : {},
      responseType: 'blob',
    }),
};
