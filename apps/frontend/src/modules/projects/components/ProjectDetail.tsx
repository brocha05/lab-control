'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { useToday } from '@/lib/hooks/useToday';
import { DUE_STATUS } from '@/lib/status';
import { cn } from '@/lib/utils/cn';
import { getApiError } from '@/lib/utils/apiError';
import { addDays, formatDateShort } from '@/lib/utils/formatters';
import { BitacoraView } from '@/modules/bitacora/components/BitacoraView';
import { ReportsList } from '@/modules/reports/components/ReportsList';
import { FieldRecordsTable } from '@/modules/field-records/components/FieldRecordsTable';
import { useFieldRecords } from '@/modules/field-records/hooks/useFieldRecords';
import { PendingTestsView } from '@/modules/specimen-tests/components/PendingTestsPage';
import { usePendingTests } from '@/modules/specimen-tests/hooks/useSpecimenTests';
import { useUiStore } from '@/store/uiStore';
import { MAX_PAGE_SIZE } from '@/types';
import { useProject, useUpdateProject } from '../hooks/useProjects';
import type { Project } from '../types/project.types';
import { ProjectForm } from './ProjectForm';
import { TestAgesCard } from './TestAgesCard';
import { Can } from '@/components/shared/Can';
import { usePermission } from '@/lib/hooks/usePermission';

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'registros', label: 'Registros' },
  { key: 'bitacora', label: 'Bitácora' },
  { key: 'ensayos', label: 'Ensayos' },
  { key: 'informes', label: 'Informes' },
  { key: 'config', label: 'Configuración' },
] as const;
type Tab = (typeof TABS)[number]['key'];

export function ProjectDetail({ id }: { id: string }) {
  const { data: project, isLoading, error } = useProject(id);
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get('tab');
  const tab: Tab = TABS.some((t) => t.key === param) ? (param as Tab) : 'resumen';
  const setCurrentProjectId = useUiStore((s) => s.setCurrentProjectId);
  const setNewRecordOpen = useUiStore((s) => s.setNewRecordOpen);
  const today = useToday();
  const records = useFieldRecords(id, { page: 1, limit: MAX_PAGE_SIZE });
  const tests = usePendingTests({ until: addDays(today, 7), projectId: id });

  useBreadcrumbs([
    { label: 'Proyectos', href: '/projects' },
    { label: project?.name ?? '…', href: `/projects/${id}` },
    { label: TABS.find((t) => t.key === tab)?.label ?? '' },
  ]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!project) {
    return (
      <p className="text-sm text-destructive">
        {getApiError(error)?.code === 'NOT_FOUND'
          ? 'El proyecto no existe.'
          : 'No se pudo cargar el proyecto.'}
      </p>
    );
  }

  const newRecord = () => {
    setCurrentProjectId(project.id);
    setNewRecordOpen(true);
  };
  const counts: Partial<Record<Tab, number>> = {
    registros: records.data?.total,
    ensayos: tests.data?.length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold leading-tight tracking-[-0.01em]">
                {project.name}
              </h1>
              {project.code && (
                <Badge tone="outline" plain className="font-mono">
                  {project.code}
                </Badge>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-7 gap-y-2 text-[13px]">
              <div>
                <span className="text-label">Cliente</span>{' '}
                <Link href={`/clients/${project.client.id}`} className="font-medium text-primary">
                  {project.client.name}
                </Link>
              </div>
              <div>
                <span className="text-label">Ubicación</span>{' '}
                <span className="font-medium">{project.location ?? '—'}</span>
              </div>
            </div>
          </div>
          <Can permission="records.capture">
            <Button size="lg" onClick={newRecord}>
              <Plus strokeWidth={2} />
              Nuevo registro de campo
            </Button>
          </Can>
        </div>

        <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b">
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = counts[t.key];
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => router.replace(`${pathname}?tab=${t.key}`)}
                className={cn(
                  '-mb-px flex h-[42px] items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm',
                  active
                    ? 'border-primary font-semibold text-foreground'
                    : 'border-transparent font-medium text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
                {count !== undefined && (
                  <span className="rounded-full bg-row px-1.5 py-px font-mono text-[11px] text-label">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'resumen' && (
        <Summary
          project={project}
          onNewRecord={newRecord}
          onSeeRecords={() => router.replace(`${pathname}?tab=registros`)}
        />
      )}
      {tab === 'registros' && <RecordsTab projectId={project.id} onNewRecord={newRecord} />}
      {tab === 'ensayos' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Can permission="records.capture">
              <Button variant="outline" asChild>
                <Link href={`/tests/worksheet?projectId=${project.id}`}>Hoja de ensayos</Link>
              </Button>
            </Can>
          </div>
          <PendingTestsView projectId={project.id} />
        </div>
      )}
      {tab === 'bitacora' && <BitacoraView projectId={project.id} />}
      {tab === 'informes' && <ReportsList projectId={project.id} />}
      {tab === 'config' && <ConfigTab project={project} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-xs text-label">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function Summary({
  project,
  onNewRecord,
  onSeeRecords,
}: {
  project: Project;
  onNewRecord: () => void;
  onSeeRecords: () => void;
}) {
  const today = useToday();
  const records = useFieldRecords(project.id, { page: 1, limit: MAX_PAGE_SIZE });
  const tests = usePendingTests({ until: addDays(today, 30), projectId: project.id });
  const items = records.data?.items ?? [];
  const completed = items.filter((r) => r.status === 'COMPLETED');
  const activity = [
    { label: 'Registros', value: records.data?.total ?? 0 },
    { label: 'Muestras', value: completed.reduce((s, r) => s + r.sampleCount, 0) },
    { label: 'Especímenes', value: completed.reduce((s, r) => s + r.specimenCount, 0) },
    { label: 'Ensayos por realizar (30 días)', value: tests.data?.length ?? 0 },
  ];
  const next = tests.data?.slice(0, 4) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
        <section className="rounded-lg border bg-card">
          <h2 className="border-b px-4 py-3.5 text-[15px] font-semibold">
            Información del proyecto
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 p-4 text-sm">
            <Field label="Cliente">{project.client.name}</Field>
            <Field label="Clave">
              <span className="font-mono">{project.code ?? '—'}</span>
            </Field>
            <Field label="Ubicación">{project.location ?? '—'}</Field>
            <Field label="Tipo de control">Concreto hidráulico</Field>
          </div>
        </section>
        <section className="flex flex-col rounded-lg border bg-card">
          <h2 className="border-b px-4 py-3.5 text-[15px] font-semibold">Resumen de actividad</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] border-b border-row">
            {activity.map((a) => (
              <div key={a.label} className="px-4 py-3.5 shadow-[inset_-1px_-1px_0_var(--row)]">
                <div className="font-mono text-2xl font-medium">{a.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{a.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 px-4 py-3">
            <div className="mb-1.5 text-xs text-label">Próximos ensayos</div>
            {next.map((t) => {
              const look = DUE_STATUS[t.dueStatus];
              return (
                <Link
                  key={t.id}
                  href={`/field-records/${t.fieldRecord.id}`}
                  className="flex items-center gap-3 whitespace-nowrap py-1.5 text-[13px]"
                >
                  <span className="flex-1 truncate font-mono">
                    Esp. {t.specimen.specimenNumber ?? '—'} · Muestra {t.sample.sampleNumber ?? '—'}{' '}
                    · {t.ageDays} días
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatDateShort(t.scheduledDate)}
                  </span>
                  <Badge tone={look.tone}>{look.label}</Badge>
                </Link>
              );
            })}
            {next.length === 0 && (
              <div className="pb-2 pt-1 text-[13px] text-subtle">
                {tests.isLoading ? 'Cargando…' : 'No hay ensayos programados.'}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3.5">
          <h2 className="text-[15px] font-semibold">Registros de campo recientes</h2>
          {items.length > 0 && (
            <button onClick={onSeeRecords} className="text-[13px] font-medium text-primary">
              Ver todos
            </button>
          )}
        </div>
        <FieldRecordsTable
          projectId={project.id}
          params={{ page: 1, limit: 5 }}
          emptyActions={
            <Can permission="records.capture">
              <Button size="sm" onClick={onNewRecord}>
                <Plus strokeWidth={2} />
                Nuevo registro de campo
              </Button>
            </Can>
          }
        />
      </section>
    </div>
  );
}

function RecordsTab({ projectId, onNewRecord }: { projectId: string; onNewRecord: () => void }) {
  const [page, setPage] = useState(1);
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <FieldRecordsTable
        projectId={projectId}
        params={{ page, limit: 20 }}
        onPageChange={setPage}
        emptyActions={
          <Can permission="records.capture">
            <Button size="sm" onClick={onNewRecord}>
              <Plus strokeWidth={2} />
              Nuevo registro de campo
            </Button>
          </Can>
        }
      />
    </section>
  );
}

function ConfigTab({ project }: { project: Project }) {
  const update = useUpdateProject(project.id);
  const canManage = usePermission('catalogs.manage');
  return (
    <fieldset disabled={!canManage} className="flex flex-col gap-5">
      {!canManage && (
        <p className="text-[13px] text-muted-foreground">
          Solo consulta: tu puesto no modifica la configuración de los proyectos.
        </p>
      )}
      <TestAgesCard projectId={project.id} />
      <section className="max-w-[860px] rounded-lg border bg-card">
        <header className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">Datos del proyecto</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Nombre oficial como aparece en el informe, clave y ubicación.
          </p>
        </header>
        <div className="p-5">
          {/* key: reset the form to the saved values after each update */}
          <ProjectForm
            key={project.updatedAt}
            project={project}
            submitLabel="Guardar cambios"
            isPending={update.isPending}
            onSubmit={(input) => update.mutate(input)}
          />
        </div>
      </section>
    </fieldset>
  );
}
