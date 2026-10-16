'use client';

import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListState } from '@/lib/hooks/useListState';
import { useClients, useCreateClient } from '../hooks/useClients';
import { ClientForm } from './ClientForm';

export function ClientsPage() {
  const router = useRouter();
  const { page, setPage, search, setSearch, params } = useListState();
  const { data, isLoading, isError } = useClients(params);
  const [creating, setCreating] = useState(false);
  const createClient = useCreateClient();

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Solicitantes y contratistas del laboratorio">
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo cliente
        </Button>
      </PageHeader>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o clave…" />

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-6 text-sm text-destructive">No se pudieron cargar los clientes.</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={params.q ? 'Sin resultados' : 'Todavía no hay clientes'}
            description={
              params.q
                ? `Ningún cliente coincide con “${params.q}”.`
                : 'Registra al primer cliente para poder crear sus proyectos.'
            }
            actionLabel={params.q ? undefined : 'Nuevo cliente'}
            onAction={params.q ? undefined : () => setCreating(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Clave</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-mono text-xs">{client.code ?? '—'}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.contactName ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.contactPhone ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && items.length > 0 && (
        <Pagination page={page} pages={data.pages} total={data.total} onPageChange={setPage} />
      )}

      <Modal open={creating} onOpenChange={setCreating} title="Nuevo cliente">
        <ClientForm
          submitLabel="Crear cliente"
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
    </div>
  );
}
