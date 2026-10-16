'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/utils/apiError';
import { projectsApi } from '../api/projectsApi';
import type { ProjectInput, ProjectListParams, TestAge } from '../types/project.types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (params: ProjectListParams) => ['projects', 'list', params] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
  testConfiguration: (id: string) => ['projects', 'test-configuration', id] as const,
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

/** The project's default test ages (Q-20). */
export function useTestConfiguration(id: string) {
  return useQuery({
    queryKey: projectKeys.testConfiguration(id),
    queryFn: async () => (await projectsApi.testConfiguration(id)).data,
  });
}

export function useSaveTestConfiguration(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ages: TestAge[]) => (await projectsApi.saveTestConfiguration(id, ages)).data,
    onSuccess: (ages) => {
      queryClient.setQueryData(projectKeys.testConfiguration(id), ages);
      toast.success('Edades de ensayo guardadas');
    },
    onError: (error) => toastApiError(error, 'No se pudieron guardar las edades.'),
  });
}
