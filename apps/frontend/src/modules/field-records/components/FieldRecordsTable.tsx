'use client';

import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
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
import { formatCalendarDate } from '@/lib/utils/formatters';
import { useFieldRecords } from '../hooks/useFieldRecords';
import { STATUS_LABELS } from '../schemas/fieldRecord.labels';
import type { FieldRecordListParams, FieldRecordStatus } from '../types/fieldRecord.types';

const STATUS_VARIANT: Record<FieldRecordStatus, 'secondary' | 'success' | 'outline'> = {
  DRAFT: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'outline',
};

export function FieldRecordStatusBadge({ status }: { status: FieldRecordStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}

interface FieldRecordsTableProps {
  projectId: string;
  params: FieldRecordListParams;
  onPageChange: (page: number) => void;
  onCreate?: () => void;
}

export function FieldRecordsTable({
  projectId,
  params,
  onPageChange,
  onCreate,
}: FieldRecordsTableProps) {
  const { data, isLoading, isError } = useFieldRecords(projectId, params);
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <p className="p-6 text-sm text-destructive">No se pudieron cargar los registros.</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Sin registros de campo"
        description="Captura aquí los registros de colado (FPC01-01) de esta obra."
        actionLabel={onCreate ? 'Nuevo registro' : undefined}
        onAction={onCreate}
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Registro</TableHead>
            <TableHead className="w-32">Fecha de colado</TableHead>
            <TableHead>Elemento colado</TableHead>
            <TableHead className="w-20 text-right">Entregas</TableHead>
            <TableHead className="w-24 text-right">Especímenes</TableHead>
            <TableHead className="w-28">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">
                <Link href={`/field-records/${r.id}`} className="hover:underline">
                  {r.registryNumber ?? 'Sin número'}
                </Link>
                {r.frontNumber > 1 && (
                  <span className="ml-1 text-muted-foreground">F{r.frontNumber}</span>
                )}
              </TableCell>
              <TableCell>{formatCalendarDate(r.pourDate)}</TableCell>
              <TableCell className="max-w-md truncate">
                <Link href={`/field-records/${r.id}`} className="hover:underline">
                  {r.castElement ?? '—'}
                </Link>
              </TableCell>
              <TableCell className="text-right">{r.deliveryCount}</TableCell>
              <TableCell className="text-right">{r.specimenCount}</TableCell>
              <TableCell>
                <FieldRecordStatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data && (
        <div className="border-t p-4">
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
