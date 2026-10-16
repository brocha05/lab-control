'use client';

import { AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils/formatters';
import { useCurrentUser } from '@/modules/auth/hooks/useAuth';
import {
  describeReportMissing,
  useCreateReport,
  useFinalizeReport,
  useGenerateReport,
  useOpenReportPdf,
  useRecordReports,
  useUpdateReport,
} from '../hooks/useReports';
import type { Report, ReportFields } from '../types/report.types';
import { ReportFieldsForm } from './ReportFieldsForm';
import { ReportStatusBadge } from './ReportStatusBadge';

const EMPTY: ReportFields = {
  mixingEquipment: null,
  compactionMethod: null,
  mixDesignReference: null,
  admixture: null,
  observations: null,
};

const pick = (r: Report): ReportFields => ({
  mixingEquipment: r.mixingEquipment,
  compactionMethod: r.compactionMethod,
  mixDesignReference: r.mixDesignReference,
  admixture: r.admixture,
  observations: r.observations,
});

/**
 * The record's FPC06-04 report (Phase 9): readiness, versions, and the steps draft →
 * PDF → issue. Only the Jefe de Control de Calidad issues (Q-40).
 */
export function RecordReportsSection({ fieldRecordId }: { fieldRecordId: string }) {
  const { data, isLoading } = useRecordReports(fieldRecordId);
  const me = useCurrentUser();
  const canIssue = me.data?.user.role === 'QUALITY_MANAGER';
  const create = useCreateReport(fieldRecordId);
  const update = useUpdateReport();
  const generate = useGenerateReport();
  const finalize = useFinalizeReport();
  const openPdf = useOpenReportPdf();
  const [editing, setEditing] = useState<Report | 'new' | null>(null);
  const [issuing, setIssuing] = useState<Report | null>(null);

  if (isLoading || !data) return <Skeleton className="h-32 w-full" />;
  const latest = data.reports[0];
  const ready = data.missing.length === 0;
  const busy = create.isPending || update.isPending || generate.isPending || finalize.isPending;

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3.5">
        <div>
          <h2 className="text-[15px] font-semibold">Informe de pruebas (FPC06-04)</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Un informe por registro: una página por muestra. Las correcciones son versiones nuevas
            con el mismo número.
          </p>
        </div>
        {(!latest || latest.status === 'FINAL') && (
          <Button onClick={() => setEditing('new')} disabled={busy}>
            <FileText />
            {latest ? 'Nueva versión (corrección)' : 'Crear informe'}
          </Button>
        )}
      </div>

      {!ready && (
        <div className="flex gap-2.5 border-b border-st-today-bd bg-st-today px-4 py-3 text-sm text-st-today-fg">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
          <div>
            <p className="font-medium">Todavía no se puede generar el PDF. Falta:</p>
            <p className="mt-0.5">
              {data.missing.slice(0, 6).map(describeReportMissing).join(', ')}
              {data.missing.length > 6 ? ` y ${data.missing.length - 6} más` : ''}.
            </p>
          </div>
        </div>
      )}

      {data.reports.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Aún no hay informe para este registro.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="h-9 px-4 text-left font-medium">Número</th>
                <th className="px-3 text-left font-medium">Versión</th>
                <th className="px-3 text-left font-medium">Estado</th>
                <th className="px-3 text-left font-medium">Generado</th>
                <th className="px-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.reports.map((r) => {
                const open = r.status !== 'FINAL';
                return (
                  <tr key={r.id} className="border-b border-row last:border-0">
                    <td className="h-12 px-4 font-mono text-[13px]">{r.reportNumber ?? '—'}</td>
                    <td className="px-3 font-mono">v{r.version}</td>
                    <td className="px-3">
                      <ReportStatusBadge report={r} />
                    </td>
                    <td className="px-3 text-[13px] text-muted-foreground">
                      {r.generatedAt ? formatDateTime(r.generatedAt) : '—'}
                    </td>
                    <td className="px-4">
                      <span className="flex flex-wrap justify-end gap-1">
                        {open && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setEditing(r)}
                            disabled={busy}
                          >
                            Datos del informe
                          </Button>
                        )}
                        {open && (
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={busy || !ready}
                            onClick={() => generate.mutate(r.id)}
                          >
                            {generate.isPending && generate.variables === r.id && (
                              <Loader2 className="animate-spin" />
                            )}
                            {r.hasPdf ? 'Regenerar PDF' : 'Generar PDF'}
                          </Button>
                        )}
                        {r.hasPdf && (
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={openPdf.isPending}
                            onClick={() => openPdf.mutate(r.id)}
                          >
                            Ver PDF
                          </Button>
                        )}
                        {r.status === 'GENERATED' && (
                          <Button
                            size="xs"
                            disabled={busy || !canIssue}
                            title={
                              canIssue
                                ? undefined
                                : 'Solo el Jefe de Control de Calidad emite informes'
                            }
                            onClick={() => setIssuing(r)}
                          >
                            Emitir
                          </Button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={
          editing === 'new'
            ? latest
              ? 'Nueva versión del informe'
              : 'Crear informe'
            : 'Datos del informe'
        }
        description="Campos que solo aparecen en el informe; normalmente son los mismos en toda la obra."
      >
        {editing && (
          <ReportFieldsForm
            initial={
              editing === 'new'
                ? latest
                  ? { ...pick(latest), observations: null }
                  : EMPTY
                : pick(editing)
            }
            submitLabel={editing === 'new' ? 'Crear' : 'Guardar'}
            isPending={create.isPending || update.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(fields) =>
              editing === 'new'
                ? create.mutate(fields, { onSuccess: () => setEditing(null) })
                : update.mutate(
                    { id: editing.id, ...fields },
                    { onSuccess: () => setEditing(null) }
                  )
            }
          />
        )}
      </Modal>

      <ConfirmDialog
        open={issuing !== null}
        onOpenChange={(o) => !o && setIssuing(null)}
        title={`Emitir informe ${issuing?.reportNumber ?? ''}`}
        description={
          issuing && issuing.version > 1
            ? 'El informe quedará emitido y ya no se podrá cambiar. La versión emitida anterior quedará sustituida.'
            : 'El informe quedará emitido y ya no se podrá cambiar; una corrección será una versión nueva.'
        }
        confirmLabel="Emitir"
        cancelLabel="Volver"
        isLoading={finalize.isPending}
        onConfirm={() =>
          issuing && finalize.mutate(issuing.id, { onSuccess: () => setIssuing(null) })
        }
      />
    </section>
  );
}
