'use client';

import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { useListState } from '@/lib/hooks/useListState';
import { ClientSelect } from '@/modules/clients/components/ClientSelect';
import { useCreateProject } from '../hooks/useProjects';
import { ProjectForm } from './ProjectForm';
import { ProjectsTable } from './ProjectsTable';
import { Can } from '@/components/shared/Can';

/** Projects, optionally filtered by `?clientId=` (from a client's "Proyectos" action). */
export function ProjectsPage() {
  useBreadcrumbs([{ label: 'Proyectos' }]);
  const router = useRouter();
  const pathname = usePathname();
  const clientId = useSearchParams().get('clientId') ?? '';
  const { setPage, search, setSearch, params } = useListState();
  const [creating, setCreating] = useState(false);
  const createProject = useCreateProject();

  const filtered = Boolean(params.q || clientId);
  const setClientId = (id: string) => {
    setPage(1);
    router.replace(id ? `${pathname}?clientId=${id}` : pathname);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Proyectos"
        description="Obras con control de calidad de concreto hidráulico"
      >
        <Can permission="catalogs.manage">
          <Button onClick={() => setCreating(true)}>
            <Plus strokeWidth={2} />
            Nuevo proyecto
          </Button>
        </Can>
      </PageHeader>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar proyecto, clave o ubicación…"
          />
          <div className="w-full sm:w-64">
            <ClientSelect value={clientId} onChange={setClientId} allLabel="Todos los clientes" />
          </div>
        </div>
        <ProjectsTable
          params={{ ...params, clientId: clientId || undefined }}
          onPageChange={setPage}
          emptyTitle={
            filtered ? 'Ningún proyecto coincide con los filtros' : 'Todavía no hay proyectos'
          }
          emptyDescription={
            filtered
              ? 'Este cliente no tiene proyectos registrados o la búsqueda no arrojó resultados.'
              : 'Crea el primer proyecto (obra) de un cliente.'
          }
          emptyActions={
            filtered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setClientId('');
                }}
              >
                Quitar filtros
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus strokeWidth={2} />
                Nuevo proyecto
              </Button>
            )
          }
        />
      </div>

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
