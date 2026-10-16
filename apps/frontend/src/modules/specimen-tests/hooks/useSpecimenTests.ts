'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/utils/apiError';
import { specimenTestsApi } from '../api/specimenTestsApi';
import type { PendingTestsParams, RescheduleInput } from '../types/specimenTest.types';

export const specimenTestKeys = {
  pending: (params: PendingTestsParams) => ['tests', 'pending', params] as const,
};

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
      toast.success('Ensaye reprogramado');
    },
    onError: (error) => toastApiError(error, 'No se pudo reprogramar el ensaye.'),
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
