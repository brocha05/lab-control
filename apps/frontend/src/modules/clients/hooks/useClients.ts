'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/utils/apiError';
import { clientsApi } from '../api/clientsApi';
import type { ClientInput, ClientListParams } from '../types/client.types';

export const clientKeys = {
  all: ['clients'] as const,
  list: (params: ClientListParams) => ['clients', 'list', params] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
};

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: async () => (await clientsApi.list(params)).data,
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => (await clientsApi.get(id)).data,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClientInput) => (await clientsApi.create(data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Cliente creado');
    },
    onError: (error) => toastApiError(error, 'No se pudo crear el cliente.'),
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ClientInput>) => (await clientsApi.update(id, data)).data,
    onSuccess: (client) => {
      queryClient.setQueryData(clientKeys.detail(id), client);
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      // Project views embed the client name.
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Cliente actualizado');
    },
    onError: (error) => toastApiError(error, 'No se pudo guardar el cliente.'),
  });
}
