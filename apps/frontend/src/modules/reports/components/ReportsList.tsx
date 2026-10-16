'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterChips } from '@/components/shared/FilterChips';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { formatDateNumeric, formatDateTime } from '@/lib/utils/formatters';
import { ProjectSelect } from '@/modules/projects/components/ProjectSelect';
import { useOpenReportPdf, useReports } from '../hooks/useReports';
import type { Report } from '../types/report.types';
import { ReportStatusBadge } from './ReportStatusBadge';

type Filter = 'all' | 'open' | 'FINAL';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Por emitir' },
  { value: 'FINAL', label: 'Emitidos' },
];

const visible = (r: Report, f: Filter) =>
  f === 'all'
    ? true
    : f === 'open'
      ? r.status !== 'FINAL'
      : r.status === 'FINAL' && !r.supersededAt;

/** "Informes": every report of the lab, or of one project. */
export function ReportsPage() {
  useBreadcrumbs([{ label: 'Informes' }]);
  const [projectId, setProjectId] = useState('');
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Informes"
        description="Informes de pruebas de control de concreto hidráulico (FPC06-04). Se crean desde cada registro de campo completado."
      />
      <ReportsList projectId={projectId || undefined} onProjectChange={setProjectId} />
    </div>
  );
}

export function ReportsList({
  projectId,
  onProjectChange,
}: {
  projectId?: string;
  /** Shows the project picker (global page). */
  onProjectChange?: (id: string) => void;
}) {
  const { data, isLoading, isError } = useReports(projectId);
  const openPdf = useOpenReportPdf();
  const [filter, setFilter] = useState<Filter>('all');
  const rows = (data ?? []).filter((r) => visible(r, filter));

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        {onProjectChange && (
          <div className="w-full sm:w-72">
            <ProjectSelect
              value={projectId ?? ''}
              onChange={onProjectChange}
              placeholder="Todos los proyectos"
            />
          </div>
        )}
        <FilterChips label="Estado" value={filter} options={FILTERS} onChange={setFilter} />
        <span className="ml-auto text-[13px] text-subtle">
          {rows.length} {rows.length === 1 ? 'informe' : 'informes'}
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : isError ? (
        <p className="p-4 text-sm text-destructive">No se pudieron cargar los informes.</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={data?.length ? 'Ningún informe con ese estado' : 'Aún no hay informes'}
          description="El informe se crea desde el registro de campo, cuando todos sus especímenes están ensayados."
        />
      ) : (
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Número de informe</TableHead>
              <TableHead className="w-16">Versión</TableHead>
              {!projectId && <TableHead>Proyecto</TableHead>}
              <TableHead className="w-28">Registro</TableHead>
              <TableHead className="w-28">Colado</TableHead>
              <TableHead className="w-32">Estado</TableHead>
              <TableHead className="w-40">Generado</TableHead>
              <TableHead className="w-44 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap font-mono text-[13px]">
                  {r.reportNumber ?? 'Sin generar'}
                </TableCell>
                <TableCell className="font-mono">v{r.version}</TableCell>
                {!projectId && <TableCell className="font-medium">{r.project.name}</TableCell>}
                <TableCell className="font-mono text-[13px] text-primary">
                  <Link href={`/field-records/${r.fieldRecord.id}`}>
                    {r.fieldRecord.registryNumber ?? '—'}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDateNumeric(r.fieldRecord.pourDate)}
                </TableCell>
                <TableCell>
                  <ReportStatusBadge report={r} />
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {r.generatedAt ? formatDateTime(r.generatedAt) : '—'}
                </TableCell>
                <TableCell>
                  <span className="flex justify-end gap-1">
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
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/field-records/${r.fieldRecord.id}`}>Ir al registro</Link>
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
