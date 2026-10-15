'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiError } from '@/lib/utils/apiError';
import { formatDateTime } from '@/lib/utils/formatters';
import { useClient, useUpdateClient } from '../hooks/useClients';
import { ClientForm } from './ClientForm';

export function ClientDetail({ id }: { id: string }) {
  const { data: client, isLoading, error } = useClient(id);
  const updateClient = useUpdateClient(id);

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Clientes
      </Link>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !client ? (
        <p className="text-sm text-destructive">
          {getApiError(error)?.code === 'NOT_FOUND'
            ? 'El cliente no existe.'
            : 'No se pudo cargar el cliente.'}
        </p>
      ) : (
        <>
          <PageHeader
            title={client.name}
            description={`Actualizado ${formatDateTime(client.updatedAt)}`}
          />
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Datos del cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {/* key: reset the form to the saved values after each update */}
              <ClientForm
                key={client.updatedAt}
                client={client}
                submitLabel="Guardar cambios"
                isPending={updateClient.isPending}
                onSubmit={(input) => updateClient.mutate(input)}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
