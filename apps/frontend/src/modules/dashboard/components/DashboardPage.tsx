'use client';

import { AlertTriangle, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MetricStrip } from '@/components/shared/MetricStrip';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { useToday } from '@/lib/hooks/useToday';
import { DUE_STATUS } from '@/lib/status';
import { addDays, formatDateLong, formatDateWithWeekday } from '@/lib/utils/formatters';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { usePendingTests } from '@/modules/specimen-tests/hooks/useSpecimenTests';
import { useUiStore } from '@/store/uiStore';
import { MAX_PAGE_SIZE } from '@/types';
import { Can } from '@/components/shared/Can';

/**
 * Counts from the list endpoints. A dedicated GET /dashboard/summary can replace them
 * later (development-plan 8.4).
 */
export function DashboardPage() {
  useBreadcrumbs([{ label: 'Dashboard' }]);
  const router = useRouter();
  const setNewRecordOpen = useUiStore((s) => s.setNewRecordOpen);
  const today = useToday();
  const clients = useClients({ page: 1, limit: 1 });
  const projects = useProjects({ page: 1, limit: MAX_PAGE_SIZE });
  const tests = usePendingTests({ until: addDays(today, 7) });

  const all = tests.data ?? [];
  const late = all.filter((t) => t.dueStatus === 'OVERDUE').length;
  const dueToday = all.filter((t) => t.dueStatus === 'DUE_TODAY').length;
  const upcoming = all.length - late - dueToday;
  const pendingByProject = new Map<string, number>();
  for (const t of all) {
    pendingByProject.set(t.project.id, (pendingByProject.get(t.project.id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Resumen de actividad del laboratorio · ${formatDateWithWeekday(today)}`}
      >
        <Can permission="records.capture">
          <Button onClick={() => setNewRecordOpen(true)}>
            <Plus strokeWidth={2} />
            Nuevo registro
          </Button>
        </Can>
      </PageHeader>

      {late + dueToday > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <AlertTriangle className="h-[18px] w-[18px] text-st-late-dot" strokeWidth={1.8} />
            Requiere atención
          </div>
          <Link href="/tests/pending" className="whitespace-nowrap text-sm text-st-late-fg">
            <span className="font-mono font-medium">{late}</span> ensayos atrasados
          </Link>
          <span className="h-4 w-px bg-border" />
          <Link href="/tests/pending" className="whitespace-nowrap text-sm text-st-today-fg">
            <span className="font-mono font-medium">{dueToday}</span> ensayos programados para hoy
          </Link>
          <Link
            href="/tests/pending"
            className="ml-auto whitespace-nowrap text-[13px] font-medium text-primary"
          >
            Ver ensayos →
          </Link>
        </div>
      )}

      <MetricStrip
        isLoading={tests.isLoading || projects.isLoading}
        metrics={[
          {
            label: 'Proyectos',
            value: projects.data?.total ?? 0,
            sub: `de ${clients.data?.total ?? 0} ${clients.data?.total === 1 ? 'cliente' : 'clientes'}`,
            href: '/projects',
          },
          { label: 'Ensayos atrasados', value: late, sub: 'fecha vencida', href: '/tests/pending' },
          {
            label: 'Ensayos para hoy',
            value: dueToday,
            sub: formatDateLong(today),
            href: '/tests/pending',
          },
          { label: 'Próximos 7 días', value: upcoming, sub: 'programados', href: '/tests/pending' },
        ]}
      />

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3.5">
          <h2 className="text-[15px] font-semibold">Ensayos próximos</h2>
          <Link href="/tests/pending" className="text-[13px] font-medium text-primary">
            Ver todos
          </Link>
        </div>
        {all.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {tests.isLoading
              ? 'Cargando…'
              : 'Sin ensayos en los próximos 7 días. Se programan al completar cada registro.'}
          </p>
        ) : (
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead className="w-28">Registro</TableHead>
                <TableHead className="w-20">Muestra</TableHead>
                <TableHead className="w-24">Espécimen</TableHead>
                <TableHead className="w-20">Edad</TableHead>
                <TableHead className="w-32">Fecha</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {all.slice(0, 7).map((t) => {
                const look = DUE_STATUS[t.dueStatus];
                return (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/field-records/${t.fieldRecord.id}`)}
                  >
                    <TableCell className="font-medium">{t.project.name}</TableCell>
                    <TableCell className="font-mono text-[13px] text-muted-foreground">
                      {t.fieldRecord.registryNumber ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[13px]">
                      {t.sample.sampleNumber ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[13px]">
                      {t.specimen.specimenNumber ?? '—'}
                    </TableCell>
                    <TableCell>{t.ageDays} días</TableCell>
                    <TableCell className="tabular-nums">
                      {formatDateLong(t.scheduledDate)}
                    </TableCell>
                    <TableCell>
                      <Badge tone={look.tone}>{look.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-[#9A9DA1]" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3.5">
          <h2 className="text-[15px] font-semibold">Proyectos</h2>
          <Link href="/projects" className="text-[13px] font-medium text-primary">
            Ver todos
          </Link>
        </div>
        {(projects.data?.items.length ?? 0) === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {projects.isLoading ? 'Cargando…' : 'Aún no hay proyectos.'}
          </p>
        ) : (
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="w-44">Ensayos próximos 7 días</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.data?.items.slice(0, 6).map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/projects/${p.id}`)}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sidebar-foreground">{p.client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.location ?? '—'}</TableCell>
                  <TableCell className="font-mono text-[13px]">
                    {pendingByProject.get(p.id) ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
