'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/utils/apiError';
import { catalogsApi } from '../api/catalogsApi';
import type { CatalogKind } from '../types/catalog.types';

export const catalogKeys = {
  list: (kind: CatalogKind) => ['catalogs', kind] as const,
  holidays: (year: number) => ['holidays', year] as const,
};

export function useCatalog(kind: CatalogKind) {
  return useQuery({
    queryKey: catalogKeys.list(kind),
    queryFn: async () => (await catalogsApi.list(kind)).data,
  });
}

export function useCreateCatalogEntry(kind: CatalogKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => (await catalogsApi.create(kind, name)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.list(kind) });
      toast.success('Agregado');
    },
    onError: (error) => toastApiError(error, 'No se pudo agregar.'),
  });
}

export function useRenameCatalogEntry(kind: CatalogKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await catalogsApi.rename(kind, id, name)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.list(kind) });
      toast.success('Nombre actualizado');
    },
    onError: (error) => toastApiError(error, 'No se pudo renombrar.'),
  });
}

export function useHolidays(year: number) {
  return useQuery({
    queryKey: catalogKeys.holidays(year),
    queryFn: async () => (await catalogsApi.listHolidays(year)).data,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, name }: { date: string; name: string }) =>
      (await catalogsApi.createHoliday(date, name)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Día festivo agregado');
    },
    onError: (error) => toastApiError(error, 'No se pudo agregar el día festivo.'),
  });
}

export function useRemoveHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await catalogsApi.removeHoliday(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Día festivo eliminado');
    },
    onError: (error) => toastApiError(error, 'No se pudo eliminar el día festivo.'),
  });
}
