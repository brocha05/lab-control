'use client';

import { FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToday } from '@/lib/hooks/useToday';
import { addDays } from '@/lib/utils/formatters';
import { usePendingTests } from '@/modules/specimen-tests/hooks/useSpecimenTests';
import { useProjects } from '../hooks/useProjects';
import type { ProjectListParams } from '../types/project.types';

interface ProjectsTableProps {
  params: ProjectListParams;
  onPageChange: (page: number) => void;
  /** Hide the client column (e.g. on a client's page). */
  hideClient?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyActions?: React.ReactNode;
}

export function ProjectsTable({
  params,
  onPageChange,
  hideClient,
  emptyTitle,
  emptyDescription,
  emptyActions,
}: ProjectsTableProps) {
  const router = useRouter();
  const today = useToday();
  const { data, isLoading, isError } = useProjects(params);
  // Open tests up to a week ahead, counted per project (overdue and today flagged).
  const tests = usePendingTests({ until: addDays(today, 7) });
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
    return <p className="p-4 text-sm text-destructive">No se pudieron cargar los proyectos.</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={emptyTitle}
        description={emptyDescription}
        actions={emptyActions}
      />
    );
  }

  const pending = (projectId: string) => {
    const mine = tests.data?.filter((t) => t.project.id === projectId) ?? [];
    return { total: mine.length, attention: mine.filter((t) => t.dueStatus !== 'UPCOMING').length };
  };

  return (
    <>
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead>Proyecto</TableHead>
            {!hideClient && <TableHead>Cliente</TableHead>}
            <TableHead>Ubicación</TableHead>
            <TableHead className="w-48">Ensayos próximos 7 días</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((project) => {
            const p = pending(project.id);
            return (
              <TableRow
                key={project.id}
                className="cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <TableCell className="h-[52px]">
                  <span className="font-medium">{project.name}</span>
                  {project.code && (
                    <span className="ml-2 font-mono text-xs text-subtle">{project.code}</span>
                  )}
                </TableCell>
                {!hideClient && (
                  <TableCell className="text-sidebar-foreground">{project.client.name}</TableCell>
                )}
                <TableCell className="text-muted-foreground">{project.location ?? '—'}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[13px]">{p.total}</span>
                    {p.attention > 0 && (
                      <span className="rounded-sm border border-st-late-bd bg-st-late px-1.5 py-px text-xs text-st-late-fg">
                        {p.attention} atención
                      </span>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {data && data.pages > 1 && (
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
