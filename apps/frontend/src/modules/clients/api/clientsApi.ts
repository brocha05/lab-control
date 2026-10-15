import apiClient from '@/lib/api/client';
import type { PaginatedResponse } from '@/types';
import type { Client, ClientInput, ClientListParams } from '../types/client.types';

// Endpoints: docs/api/endpoints.md#clients--projects
export const clientsApi = {
  list: (params: ClientListParams) =>
    apiClient.get<PaginatedResponse<Client>>('/clients', { params }),

  get: (id: string) => apiClient.get<Client>(`/clients/${id}`),

  create: (data: ClientInput) => apiClient.post<Client>('/clients', data),

  update: (id: string, data: Partial<ClientInput>) =>
    apiClient.patch<Client>(`/clients/${id}`, data),
};
