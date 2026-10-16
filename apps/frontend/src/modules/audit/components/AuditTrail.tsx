'use client';

import { History } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/lib/hooks/usePermission';
import { formatDateTime } from '@/lib/utils/formatters';
import type { AuditEvent } from '../api/auditApi';
import { useAuditEvents } from '../hooks/useAudit';

/** What each route did, in the lab's words. Unknown routes show the route itself. */
const ACTIONS: Record<string, string> = {
  'POST /clients': 'Creó el cliente',
  'PATCH /clients/:id': 'Modificó el cliente',
  'POST /projects': 'Creó el proyecto',
  'PATCH /projects/:id': 'Modificó el proyecto',
  'PUT /projects/:id/test-configuration': 'Cambió las edades de ensayo del proyecto',
  'POST /projects/:projectId/field-records': 'Creó el registro de campo',
  'PUT /field-records/:id': 'Guardó el registro de campo',
  'POST /field-records/:id/complete': 'Completó el registro y programó sus ensayos',
  'POST /field-records/:id/cancel': 'Canceló el registro de campo',
  'POST /specimens/:id/cancel': 'Canceló un espécimen dañado',
  'PATCH /tests/:id/schedule': 'Cambió la edad o fecha de un ensayo',
  'PUT /tests/results': 'Guardó resultados de ensayos',
  'POST /field-records/:id/reports': 'Creó una versión del informe',
  'PATCH /reports/:id': 'Modificó los datos del informe',
  'POST /reports/:id/generate': 'Generó el PDF del informe',
  'POST /reports/:id/finalize': 'Emitió el informe',
  'POST /catalogs/suppliers': 'Agregó un proveedor',
  'PATCH /catalogs/suppliers/:id': 'Renombró un proveedor',
  'POST /catalogs/cement-types': 'Agregó un tipo de cemento',
  'PATCH /catalogs/cement-types/:id': 'Renombró un tipo de cemento',
  'POST /holidays': 'Agregó un día festivo',
  'DELETE /holidays/:id': 'Quitó un día festivo',
  'POST /users': 'Creó un usuario',
  'PATCH /users/:id': 'Modificó un usuario',
  'POST /users/:id/password': 'Cambió la contraseña de un usuario',
};

function entityHref(e: AuditEvent): string | null {
  if (!e.entityId) return null;
  if (e.entityType === 'field-records') return `/field-records/${e.entityId}`;
  if (e.entityType === 'clients') return `/clients/${e.entityId}`;
  if (e.entityType === 'projects') return `/projects/${e.entityId}`;
  return null;
}

/**
 * "Historial de cambios": who changed what and when (ADR-010, Q-54). Only for roles that
 * read the audit trail.
 */
export function AuditTrail({
  entityIds,
  title = 'Historial de cambios',
  showLinks = false,
}: {
  entityIds?: string[];
  title?: string;
  showLinks?: boolean;
}) {
  const allowed = usePermission('audit.read');
  const query = useAuditEvents(entityIds, allowed);
  if (!allowed) return null;
  const events = query.data?.pages.flat() ?? [];

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3.5">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Cada cambio queda registrado con su autor; no se puede editar ni borrar.
        </p>
      </div>
      {query.isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
      ) : events.length === 0 ? (
        <EmptyState icon={History} title="Sin cambios registrados" />
      ) : (
        <ol className="divide-y divide-row">
          {events.map((e) => {
            const href = showLinks ? entityHref(e) : null;
            return (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5 text-sm"
              >
                <span className="w-40 shrink-0 tabular-nums text-[13px] text-muted-foreground">
                  {formatDateTime(e.createdAt)}
                </span>
                <span className="font-medium">{e.actor?.fullName ?? 'Sistema'}</span>
                <span>{ACTIONS[e.action] ?? e.action}</span>
                {href && (
                  <Link href={href} className="text-[13px] text-primary">
                    ver
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {query.hasNextPage && (
        <div className="border-t px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            Ver anteriores
          </Button>
        </div>
      )}
    </section>
  );
}
