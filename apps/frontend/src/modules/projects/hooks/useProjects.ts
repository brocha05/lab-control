'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/utils/apiError';
import { projectsApi } from '../api/projectsApi';
import type { ProjectInput, ProjectListParams } from '../types/project.types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (params: ProjectListParams) => ['projects', 'list', params] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => (await projectsApi.list(params)).data,
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => (await projectsApi.get(id)).data,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProjectInput) => (await projectsApi.create(data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Proyecto creado');
    },
    onError: (error) => toastApiError(error, 'No se pudo crear el proyecto.'),
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProjectInput>) => (await projectsApi.update(id, data)).data,
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(id), project);
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Proyecto actualizado');
    },
    onError: (error) => toastApiError(error, 'No se pudo guardar el proyecto.'),
  });
}
