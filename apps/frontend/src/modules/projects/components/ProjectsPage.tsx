'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useListState } from '@/lib/hooks/useListState';
import { ClientSelect } from '@/modules/clients/components/ClientSelect';
import { useCreateProject } from '../hooks/useProjects';
import { ProjectForm } from './ProjectForm';
import { ProjectsTable } from './ProjectsTable';

export function ProjectsPage() {
  const router = useRouter();
  const { setPage, search, setSearch, params } = useListState();
  const [clientId, setClientId] = useState('');
  const [creating, setCreating] = useState(false);
  const createProject = useCreateProject();

  const filtered = Boolean(params.q || clientId);

  return (
    <div className="space-y-6">
      <PageHeader title="Proyectos" description="Obras bajo control de calidad">
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo proyecto
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar obra o ubicación…" />
        <div className="w-full sm:w-72">
          <ClientSelect
            value={clientId}
            onChange={(v) => {
              setClientId(v);
              setPage(1);
            }}
            allLabel="Todos los clientes"
          />
        </div>
      </div>

      <Card>
        <ProjectsTable
          params={{ ...params, clientId: clientId || undefined }}
          onPageChange={setPage}
          emptyTitle={filtered ? 'Sin resultados' : 'Todavía no hay proyectos'}
          emptyDescription={
            filtered
              ? 'Ningún proyecto coincide con los filtros.'
              : 'Crea el primer proyecto (obra) de un cliente.'
          }
          onCreate={filtered ? undefined : () => setCreating(true)}
        />
      </Card>

      <Modal open={creating} onOpenChange={setCreating} title="Nuevo proyecto">
        <ProjectForm
          defaultClientId={clientId || undefined}
          submitLabel="Crear proyecto"
          isPending={createProject.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            createProject.mutate(input, {
              onSuccess: (project) => {
                setCreating(false);
                router.push(`/projects/${project.id}`);
              },
            })
          }
        />
      </Modal>
    </div>
  );
}
