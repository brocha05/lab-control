'use client';

import { ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FIELD_RECORD_STATUS } from '@/lib/status';
import { formatDateNumeric } from '@/lib/utils/formatters';
import { useFieldRecords } from '../hooks/useFieldRecords';
import type { FieldRecordListParams, FieldRecordStatus } from '../types/fieldRecord.types';

export function FieldRecordStatusBadge({ status }: { status: FieldRecordStatus }) {
  const look = FIELD_RECORD_STATUS[status];
  return <Badge tone={look.tone}>{look.label}</Badge>;
}

interface FieldRecordsTableProps {
  projectId: string;
  params: FieldRecordListParams;
  /** Without it, no pagination footer (e.g. "recent records"). */
  onPageChange?: (page: number) => void;
  emptyActions?: React.ReactNode;
}

export function FieldRecordsTable({
  projectId,
  params,
  onPageChange,
  emptyActions,
}: FieldRecordsTableProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useFieldRecords(projectId, params);
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <p className="p-4 text-sm text-destructive">No se pudieron cargar los registros.</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Este proyecto aún no tiene registros de campo"
        description="Al completar el primer registro se programan los ensayos de sus especímenes."
        actions={emptyActions}
      />
    );
  }

  return (
    <>
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Registro</TableHead>
            <TableHead className="w-28">Colado</TableHead>
            <TableHead>Elemento colado</TableHead>
            <TableHead className="w-24 text-right">Entregas</TableHead>
            <TableHead className="w-24 text-right">Muestras</TableHead>
            <TableHead className="w-28 text-right">Especímenes</TableHead>
            <TableHead className="w-32">Captura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow
              key={r.id}
              className="cursor-pointer"
              onClick={() => router.push(`/field-records/${r.id}`)}
            >
              <TableCell className="h-[50px] font-mono text-[13px] text-primary">
                {r.registryNumber ?? 'Sin número'}
                {r.frontNumber > 1 && <span className="ml-1 text-subtle">F{r.frontNumber}</span>}
              </TableCell>
              <TableCell className="tabular-nums">{formatDateNumeric(r.pourDate)}</TableCell>
              <TableCell className="max-w-md truncate font-medium">
                {r.castElement ?? '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-[13px]">{r.deliveryCount}</TableCell>
              <TableCell className="text-right font-mono text-[13px]">{r.sampleCount}</TableCell>
              <TableCell className="text-right font-mono text-[13px]">{r.specimenCount}</TableCell>
              <TableCell>
                <FieldRecordStatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data && onPageChange && data.pages > 1 && (
        <div className="border-t px-4 py-3">
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
