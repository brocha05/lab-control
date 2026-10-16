'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/utils/apiError';
import { specimenTestsApi } from '../api/specimenTestsApi';
import type {
  PendingTestsParams,
  RescheduleInput,
  SaveTestResultsInput,
} from '../types/specimenTest.types';

export const specimenTestKeys = {
  pending: (params: PendingTestsParams) => ['tests', 'pending', params] as const,
  worksheet: (projectId: string, testDate: string) =>
    ['tests', 'worksheet', projectId, testDate] as const,
};

/** The FPC06-01 sheet of a project and test date (7.4). */
export function useWorksheet(projectId: string, testDate: string) {
  return useQuery({
    queryKey: specimenTestKeys.worksheet(projectId, testDate),
    queryFn: async () => (await specimenTestsApi.worksheet(projectId, testDate)).data,
    enabled: !!projectId && !!testDate,
  });
}

/** Saves a sheet's press readings; each row completes (or corrects) its test. */
export function useSaveTestResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SaveTestResultsInput) =>
      (await specimenTestsApi.saveResults(data)).data,
    onSuccess: ({ saved }) => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['field-records', 'detail'] });
      toast.success(saved === 1 ? '1 resultado guardado' : `${saved} resultados guardados`);
    },
    onError: (error) => toastApiError(error, 'No se pudieron guardar los resultados.'),
  });
}

/** Open tests up to a date, with derived dates and due status (6.5). */
export function usePendingTests(params: PendingTestsParams) {
  return useQuery({
    queryKey: specimenTestKeys.pending(params),
    queryFn: async () => (await specimenTestsApi.pending(params)).data,
    placeholderData: keepPreviousData,
    // Due status changes with the day; keep it fresh.
    staleTime: 60_000,
  });
}

export function useRescheduleTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: RescheduleInput & { id: string }) =>
      (await specimenTestsApi.reschedule(id, data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['field-records', 'detail'] });
      toast.success('Ensayo reprogramado');
    },
    onError: (error) => toastApiError(error, 'No se pudo reprogramar el ensayo.'),
  });
}

export function useCancelSpecimen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (specimenId: string) =>
      (await specimenTestsApi.cancelSpecimen(specimenId)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['field-records'] });
      toast.success('Espécimen cancelado');
    },
    onError: (error) => toastApiError(error, 'No se pudo cancelar el espécimen.'),
  });
}
