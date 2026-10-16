'use client';

import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { SearchInput } from '@/components/shared/SearchInput';
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
import { useListState } from '@/lib/hooks/useListState';
import { useClients, useCreateClient, useUpdateClient } from '../hooks/useClients';
import type { Client } from '../types/client.types';
import { ClientForm } from './ClientForm';
import { Can } from '@/components/shared/Can';

export function ClientsPage() {
  useBreadcrumbs([{ label: 'Clientes' }]);
  const router = useRouter();
  const { page, setPage, search, setSearch, params } = useListState();
  const { data, isLoading, isError } = useClients(params);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const createClient = useCreateClient();

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Clientes"
        description="Empresas constructoras y desarrolladoras atendidas por el laboratorio"
      >
        <Can permission="catalogs.manage">
          <Button onClick={() => setCreating(true)}>
            <Plus strokeWidth={2} />
            Nuevo cliente
          </Button>
        </Can>
      </PageHeader>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente o clave…" />
          {data && (
            <span className="ml-auto text-[13px] text-subtle">
              {data.total} {data.total === 1 ? 'cliente' : 'clientes'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">No se pudieron cargar los clientes.</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title={params.q ? `Sin resultados para “${params.q}”` : 'Todavía no hay clientes'}
            description={
              params.q
                ? 'Revisa la ortografía o busca por clave. También puedes registrar el cliente si aún no existe.'
                : 'Registra al primer cliente para poder crear sus proyectos.'
            }
            actions={
              <>
                {params.q && (
                  <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                    Limpiar búsqueda
                  </Button>
                )}
                <Can permission="catalogs.manage">
                  <Button size="sm" onClick={() => setCreating(true)}>
                    <Plus strokeWidth={2} />
                    Nuevo cliente
                  </Button>
                </Can>
              </>
            }
          />
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-24">Clave</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="w-60 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="h-14">
                    <button
                      type="button"
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="text-left font-medium hover:text-primary"
                    >
                      {client.name}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-sidebar-foreground">
                    {client.code ?? '—'}
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col leading-snug">
                      <span>{client.contactName ?? '—'}</span>
                      {client.contactPhone && (
                        <span className="text-xs text-label">{client.contactPhone}</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        Ver
                      </Button>
                      <Can permission="catalogs.manage">
                        <Button variant="ghost" size="xs" onClick={() => setEditing(client)}>
                          Editar
                        </Button>
                      </Can>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => router.push(`/projects?clientId=${client.id}`)}
                      >
                        Proyectos
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {data && data.pages > 1 && (
          <div className="border-t px-4 py-3">
            <Pagination page={page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        open={creating}
        onOpenChange={setCreating}
        title="Nuevo cliente"
        description="Registra un cliente para asociarle proyectos e informes."
      >
        <ClientForm
          submitLabel="Guardar cliente"
          isPending={createClient.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            createClient.mutate(input, {
              onSuccess: (client) => {
                setCreating(false);
                router.push(`/clients/${client.id}`);
              },
            })
          }
        />
      </Modal>

      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Editar cliente"
        description="Actualiza el nombre, la clave y el contacto del cliente."
      >
        {editing && <EditClient client={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

function EditClient({ client, onDone }: { client: Client; onDone: () => void }) {
  const update = useUpdateClient(client.id);
  return (
    <ClientForm
      client={client}
      submitLabel="Guardar cambios"
      isPending={update.isPending}
      onCancel={onDone}
      onSubmit={(input) => update.mutate(input, { onSuccess: onDone })}
    />
  );
}
