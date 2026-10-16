'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, toastApiError } from '@/lib/utils/apiError';
import { describeMissing } from '@/modules/field-records/schemas/fieldRecord.labels';
import { reportsApi } from '../api/reportsApi';
import type { ReportFields } from '../types/report.types';

export const reportKeys = {
  all: ['reports'] as const,
  list: (projectId?: string) => ['reports', 'list', projectId ?? 'all'] as const,
  record: (fieldRecordId: string) => ['reports', 'record', fieldRecordId] as const,
};

export function useReports(projectId?: string) {
  return useQuery({
    queryKey: reportKeys.list(projectId),
    queryFn: async () => (await reportsApi.list(projectId)).data,
  });
}

export function useRecordReports(fieldRecordId: string) {
  return useQuery({
    queryKey: reportKeys.record(fieldRecordId),
    queryFn: async () => (await reportsApi.forRecord(fieldRecordId)).data,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: reportKeys.all });
}

export function useCreateReport(fieldRecordId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (fields: Partial<ReportFields>) =>
      (await reportsApi.create(fieldRecordId, fields)).data,
    onSuccess: (r) => {
      invalidate();
      toast.success(r.version > 1 ? `Versión ${r.version} creada` : 'Informe creado');
    },
    onError: (error) => toastApiError(error, 'No se pudo crear el informe.'),
  });
}

export function useUpdateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<ReportFields> & { id: string }) =>
      (await reportsApi.update(id, fields)).data,
    onSuccess: () => {
      invalidate();
      toast.success('Datos del informe guardados');
    },
    onError: (error) => toastApiError(error, 'No se pudieron guardar los datos.'),
  });
}

export function useGenerateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => (await reportsApi.generate(id)).data,
    onSuccess: () => {
      invalidate();
      toast.success('PDF generado');
    },
    onError: (error) => {
      const apiError = getApiError(error);
      if (apiError?.code === 'UNPROCESSABLE_ENTITY' && apiError.details?.length) {
        toast.error(`Falta: ${apiError.details.slice(0, 3).map(describeReportMissing).join(', ')}`);
        return;
      }
      toastApiError(error, 'No se pudo generar el PDF.');
    },
  });
}

export function useFinalizeReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => (await reportsApi.finalize(id)).data,
    onSuccess: () => {
      invalidate();
      toast.success('Informe emitido');
    },
    onError: (error) => toastApiError(error, 'No se pudo emitir el informe.'),
  });
}

/** Opens the stored PDF in a new tab (the download needs the auth header). */
export function useOpenReportPdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = (await reportsApi.pdf(id)).data;
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (error) => toastApiError(error, 'No se pudo abrir el PDF.'),
  });
}

const REPORT_MISSING: Record<string, string> = {
  'record.status': 'el registro no está completado',
  'client.code': 'la clave del cliente',
  'project.code': 'la clave del proyecto',
  'record.registrySequence': 'el número de registro',
  'record.specifiedStrengthKgCm2': "el f'c de proyecto",
  specimens: 'especímenes',
};

/** "specimens[405].test" → "ensayo del espécimen 405". */
export function describeReportMissing(path: string): string {
  const m = /^specimens\[(.+)\]\.test$/.exec(path);
  if (m) return `ensayo del espécimen ${m[1]}`;
  return REPORT_MISSING[path] ?? describeMissing(path);
}
