'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { getApiError } from '@/lib/utils/apiError';
import { ProjectForm } from '@/modules/projects/components/ProjectForm';
import { ProjectsTable } from '@/modules/projects/components/ProjectsTable';
import { useCreateProject } from '@/modules/projects/hooks/useProjects';
import { useClient, useUpdateClient } from '../hooks/useClients';
import { ClientForm } from './ClientForm';
import { Can } from '@/components/shared/Can';

export function ClientDetail({ id }: { id: string }) {
  const { data: client, isLoading, error } = useClient(id);
  const updateClient = useUpdateClient(id);
  const router = useRouter();
  const [projectsPage, setProjectsPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const createProject = useCreateProject();
  useBreadcrumbs([{ label: 'Clientes', href: '/clients' }, { label: client?.name ?? '…' }]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!client) {
    return (
      <p className="text-sm text-destructive">
        {getApiError(error)?.code === 'NOT_FOUND'
          ? 'El cliente no existe.'
          : 'No se pudo cargar el cliente.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {client.name}
            {client.code && (
              <Badge tone="outline" plain className="font-mono">
                {client.code}
              </Badge>
            )}
          </span>
        }
        description="Cliente del laboratorio"
      >
        <Can permission="catalogs.manage">
          <Button variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
        </Can>
      </PageHeader>

      <section className="max-w-[860px] rounded-lg border bg-card">
        <h2 className="border-b px-4 py-3.5 text-[15px] font-semibold">Contacto</h2>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 p-4 text-sm">
          <div>
            <div className="mb-0.5 text-xs text-label">Contacto principal</div>
            <div className="font-medium">{client.contactName ?? '—'}</div>
          </div>
          <div>
            <div className="mb-0.5 text-xs text-label">Teléfono</div>
            <div className="font-medium">{client.contactPhone ?? '—'}</div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-[15px] font-semibold">Proyectos</h2>
          <Can permission="catalogs.manage">
            <Button size="sm" variant="outline" onClick={() => setCreatingProject(true)}>
              <Plus />
              Nuevo proyecto
            </Button>
          </Can>
        </div>
        <ProjectsTable
          params={{ page: projectsPage, limit: 10, clientId: id }}
          onPageChange={setProjectsPage}
          hideClient
          emptyTitle="Este cliente no tiene proyectos"
        />
      </section>

      <Modal open={editing} onOpenChange={setEditing} title="Editar cliente">
        <ClientForm
          client={client}
          submitLabel="Guardar cambios"
          isPending={updateClient.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(input) => updateClient.mutate(input, { onSuccess: () => setEditing(false) })}
        />
      </Modal>

      <Modal open={creatingProject} onOpenChange={setCreatingProject} title="Nuevo proyecto">
        <ProjectForm
          defaultClientId={id}
          submitLabel="Crear proyecto"
          isPending={createProject.isPending}
          onCancel={() => setCreatingProject(false)}
          onSubmit={(input) =>
            createProject.mutate(input, {
              onSuccess: (project) => router.push(`/projects/${project.id}`),
            })
          }
        />
      </Modal>
    </div>
  );
}
