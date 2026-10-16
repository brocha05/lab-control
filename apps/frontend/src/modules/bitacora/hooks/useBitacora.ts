'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { toastApiError } from '@/lib/utils/apiError';
import { bitacoraApi } from '../api/bitacoraApi';
import type { BitacoraParams } from '../types/bitacora.types';

export function useBitacora(projectId: string, params: BitacoraParams) {
  return useQuery({
    queryKey: ['bitacora', projectId, params],
    queryFn: async () => (await bitacoraApi.forProject(projectId, params)).data,
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
}

/** Downloads the Excel workbook (FPC01-02 columns, a tab per project). */
export function useExportBitacora() {
  return useMutation({
    mutationFn: async ({ projectId, fileName }: { projectId?: string; fileName: string }) => {
      const blob = (await bitacoraApi.export(projectId)).data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toastApiError(error, 'No se pudo exportar la Bitácora.'),
  });
}
