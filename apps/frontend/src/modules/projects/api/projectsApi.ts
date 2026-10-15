import apiClient from '@/lib/api/client';
import type { PaginatedResponse } from '@/types';
import type { Project, ProjectInput, ProjectListParams } from '../types/project.types';

// Endpoints: docs/api/endpoints.md#clients--projects
export const projectsApi = {
  list: (params: ProjectListParams) =>
    apiClient.get<PaginatedResponse<Project>>('/projects', { params }),

  get: (id: string) => apiClient.get<Project>(`/projects/${id}`),

  create: (data: ProjectInput) => apiClient.post<Project>('/projects', data),

  update: (id: string, data: Partial<ProjectInput>) =>
    apiClient.patch<Project>(`/projects/${id}`, data),
};
