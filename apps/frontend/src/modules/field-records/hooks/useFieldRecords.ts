'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, toastApiError } from '@/lib/utils/apiError';
import { fieldRecordsApi } from '../api/fieldRecordsApi';
import { describeMissing } from '../schemas/fieldRecord.labels';
import type {
  CreateFieldRecordInput,
  FieldRecordListParams,
  FieldRecordPayload,
} from '../types/fieldRecord.types';

export const fieldRecordKeys = {
  all: ['field-records'] as const,
  list: (projectId: string, params: FieldRecordListParams) =>
    ['field-records', 'list', projectId, params] as const,
  detail: (id: string) => ['field-records', 'detail', id] as const,
  nextNumbers: (projectId: string) => ['field-records', 'next-numbers', projectId] as const,
};

export function useFieldRecords(projectId: string | undefined, params: FieldRecordListParams) {
  return useQuery({
    queryKey: fieldRecordKeys.list(projectId ?? '', params),
    queryFn: async () => (await fieldRecordsApi.list(projectId as string, params)).data,
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
}

export function useFieldRecord(id: string) {
  return useQuery({
    queryKey: fieldRecordKeys.detail(id),
    queryFn: async () => (await fieldRecordsApi.get(id)).data,
  });
}

/** Next registro / sample / specimen numbers of the project (Q-55, Q-57, Q-58). */
export function useNextNumbers(projectId: string | undefined) {
  return useQuery({
    queryKey: fieldRecordKeys.nextNumbers(projectId ?? ''),
    queryFn: async () => (await fieldRecordsApi.nextNumbers(projectId as string)).data,
    enabled: !!projectId,
    staleTime: 0,
  });
}

export function useCreateFieldRecord(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFieldRecordInput) =>
      (await fieldRecordsApi.create(projectId, data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fieldRecordKeys.all });
      toast.success('Registro creado');
    },
    onError: (error) => toastApiError(error, 'No se pudo crear el registro.'),
  });
}

export function useSaveFieldRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FieldRecordPayload) => (await fieldRecordsApi.save(id, data)).data,
    onSuccess: (record) => {
      queryClient.setQueryData(fieldRecordKeys.detail(id), record);
      void queryClient.invalidateQueries({ queryKey: ['field-records', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['field-records', 'next-numbers'] });
      toast.success('Registro guardado');
    },
    onError: (error) => toastApiError(error, 'No se pudo guardar el registro.'),
  });
}

export function useCompleteFieldRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await fieldRecordsApi.complete(id)).data,
    onSuccess: (record) => {
      queryClient.setQueryData(fieldRecordKeys.detail(id), record);
      void queryClient.invalidateQueries({ queryKey: ['field-records', 'list'] });
      // Completing plans the record's tests (6.4).
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Registro completado');
    },
    onError: (error) => {
      const apiError = getApiError(error);
      if (apiError?.code === 'UNPROCESSABLE_ENTITY' && apiError.details?.length) {
        const first = apiError.details.slice(0, 3).map(describeMissing).join(', ');
        const more = apiError.details.length > 3 ? '…' : '';
        toast.error(`Faltan ${apiError.details.length} datos: ${first}${more}`);
        return;
      }
      toastApiError(error, 'No se pudo completar el registro.');
    },
  });
}

export function useCancelFieldRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await fieldRecordsApi.cancel(id)).data,
    onSuccess: (record) => {
      queryClient.setQueryData(fieldRecordKeys.detail(id), record);
      void queryClient.invalidateQueries({ queryKey: ['field-records', 'list'] });
      toast.success('Registro cancelado');
    },
    onError: (error) => toastApiError(error, 'No se pudo cancelar el registro.'),
  });
}
