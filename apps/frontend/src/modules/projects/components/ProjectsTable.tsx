'use client';

import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
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
import { useProjects } from '../hooks/useProjects';
import type { ProjectListParams } from '../types/project.types';

interface ProjectsTableProps {
  params: ProjectListParams;
  onPageChange: (page: number) => void;
  /** Hide the client column (e.g. on a client's page). */
  hideClient?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  onCreate?: () => void;
}

export function ProjectsTable({
  params,
  onPageChange,
  hideClient,
  emptyTitle,
  emptyDescription,
  onCreate,
}: ProjectsTableProps) {
  const { data, isLoading, isError } = useProjects(params);
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
    return <p className="p-6 text-sm text-destructive">No se pudieron cargar los proyectos.</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onCreate ? 'Nuevo proyecto' : undefined}
        onAction={onCreate}
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Obra</TableHead>
            {!hideClient && <TableHead>Cliente</TableHead>}
            <TableHead>Ubicación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link href={`/projects/${project.id}`} className="hover:underline">
                  {project.name}
                </Link>
              </TableCell>
              {!hideClient && (
                <TableCell>
                  <Link
                    href={`/clients/${project.client.id}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {project.client.name}
                  </Link>
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{project.location ?? '—'}</TableCell>
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
