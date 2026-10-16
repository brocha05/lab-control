'use client';

import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiError } from '@/lib/utils/apiError';
import { useProject, useUpdateProject } from '../hooks/useProjects';
import { ProjectForm } from './ProjectForm';
import { TestAgesCard } from './TestAgesCard';

export function ProjectDetail({ id }: { id: string }) {
  const { data: project, isLoading, error } = useProject(id);
  const updateProject = useUpdateProject(id);

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Proyectos
      </Link>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !project ? (
        <p className="text-sm text-destructive">
          {getApiError(error)?.code === 'NOT_FOUND'
            ? 'El proyecto no existe.'
            : 'No se pudo cargar el proyecto.'}
        </p>
      ) : (
        <>
          <PageHeader title={project.name} description={project.location ?? undefined}>
            <Link
              href={`/clients/${project.client.id}`}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {project.client.name}
            </Link>
          </PageHeader>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Datos de la obra</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectForm
                key={project.updatedAt}
                project={project}
                submitLabel="Guardar cambios"
                isPending={updateProject.isPending}
                onSubmit={(input) => updateProject.mutate(input)}
              />
            </CardContent>
          </Card>
          <Link
            href={`/field-records?projectId=${project.id}`}
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            <ClipboardList className="mr-1.5 h-4 w-4" />
            Ver los registros de campo de esta obra
          </Link>
          <TestAgesCard projectId={project.id} />
        </>
      )}
    </div>
  );
}
