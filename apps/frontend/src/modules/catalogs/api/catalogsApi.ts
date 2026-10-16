import apiClient from '@/lib/api/client';
import type { CatalogEntry, CatalogKind, Holiday } from '../types/catalog.types';

// Endpoints: docs/api/endpoints.md (catalogs, holidays)
export const catalogsApi = {
  list: (kind: CatalogKind) => apiClient.get<CatalogEntry[]>(`/catalogs/${kind}`),

  create: (kind: CatalogKind, name: string) =>
    apiClient.post<CatalogEntry>(`/catalogs/${kind}`, { name }),

  rename: (kind: CatalogKind, id: string, name: string) =>
    apiClient.patch<CatalogEntry>(`/catalogs/${kind}/${id}`, { name }),

  listHolidays: (year: number) => apiClient.get<Holiday[]>('/holidays', { params: { year } }),

  createHoliday: (date: string, name: string) =>
    apiClient.post<Holiday>('/holidays', { date, name }),

  removeHoliday: (id: string) => apiClient.delete<void>(`/holidays/${id}`),
};
