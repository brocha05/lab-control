'use client';

import { Check, CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterChips } from '@/components/shared/FilterChips';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
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
import { useToday } from '@/lib/hooks/useToday';
import { DUE_STATUS } from '@/lib/status';
import { cn } from '@/lib/utils/cn';
import { addDays, formatDateLong, formatDateShort } from '@/lib/utils/formatters';
import { ProjectSelect } from '@/modules/projects/components/ProjectSelect';
import { usePendingTests } from '../hooks/useSpecimenTests';
import type { DueStatus, PendingTest } from '../types/specimenTest.types';
import { RescheduleForm } from './RescheduleForm';

const WINDOWS = [
  { days: 0, label: 'Hasta hoy' },
  { days: 7, label: 'Próximos 7 días' },
  { days: 14, label: 'Próximos 14 días' },
  { days: 30, label: 'Próximos 30 días' },
];

type StatusFilter = 'all' | DueStatus;

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Por realizar' },
  { value: 'OVERDUE', label: 'Atrasado' },
  { value: 'DUE_TODAY', label: 'Hoy' },
  { value: 'UPCOMING', label: 'Pendiente' },
];

// Static class names so Tailwind generates them.
const TILE: Record<DueStatus, { active: string; dot: string; value: string }> = {
  OVERDUE: {
    active: 'border-st-late-dot bg-st-late',
    dot: 'bg-st-late-dot',
    value: 'text-st-late-fg',
  },
  DUE_TODAY: {
    active: 'border-st-today-dot bg-st-today',
    dot: 'bg-st-today-dot',
    value: 'text-st-today-fg',
  },
  UPCOMING: {
    active: 'border-st-pending-dot bg-st-pending',
    dot: 'bg-st-pending-dot',
    value: 'text-foreground',
  },
};

const ROW_BG: Record<DueStatus, string> = {
  OVERDUE: 'bg-[#FFFAFA]',
  DUE_TODAY: 'bg-[#FFFDF6]',
  UPCOMING: '',
};

/** "Ensayos pendientes": every open test, or one project's when `projectId` is given. */
export function PendingTestsPage() {
  useBreadcrumbs([{ label: 'Ensayos pendientes' }]);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Ensayos pendientes"
        description="Especímenes por ensayar, con la fecha ya recorrida por domingos y días festivos"
      >
        <Button asChild>
          <Link href="/tests/worksheet">Hoja de ensayos</Link>
        </Button>
      </PageHeader>
      <PendingTestsView />
    </div>
  );
}

export function PendingTestsView({ projectId: fixedProject }: { projectId?: string }) {
  const today = useToday();
  const [projectId, setProjectId] = useState('');
  const [windowDays, setWindowDays] = useState(7);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [age, setAge] = useState('all');
  const [editing, setEditing] = useState<PendingTest | null>(null);
  const until = addDays(today, windowDays);
  const { data, isLoading, isError } = usePendingTests({
    until,
    projectId: fixedProject ?? (projectId || undefined),
  });

  const all = data ?? [];
  const ages = [...new Set(all.map((t) => t.ageDays))].sort((a, b) => a - b);
  const byAge = all.filter((t) => age === 'all' || String(t.ageDays) === age);
  const rows = byAge.filter((t) => status === 'all' || t.dueStatus === status);
  const count = (s: DueStatus) => byAge.filter((t) => t.dueStatus === s).length;

  const tiles: { status: DueStatus; label: string; sub: string }[] = [
    { status: 'OVERDUE', label: 'Atrasados', sub: 'Fecha programada vencida' },
    { status: 'DUE_TODAY', label: 'Para hoy', sub: formatDateLong(today) },
    {
      status: 'UPCOMING',
      label: windowDays ? `Próximos ${windowDays} días` : 'Próximos',
      sub: windowDays ? `Hasta ${formatDateShort(until)}` : 'Amplía el periodo para verlos',
    },
  ];

  const clear = () => {
    setStatus('all');
    setAge('all');
    setProjectId('');
  };

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {tiles.map((t) => {
          const active = status === t.status;
          const value = count(t.status);
          const look = TILE[t.status];
          return (
            <button
              key={t.status}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(active ? 'all' : t.status)}
              className={cn(
                'flex flex-col items-start gap-1 whitespace-nowrap rounded-lg border px-4 py-3.5 text-left transition-colors',
                active ? look.active : 'bg-card hover:bg-surface'
              )}
            >
              <span className="flex items-center gap-2 text-[13px] font-medium text-sidebar-foreground">
                <span className={`h-2 w-2 rounded-full ${look.dot}`} />
                {t.label}
              </span>
              <span
                className={cn(
                  'font-mono text-[28px] font-medium leading-[1.15]',
                  t.status !== 'UPCOMING' && value > 0 ? look.value : 'text-foreground'
                )}
              >
                {isLoading ? '—' : value}
              </span>
              <span className="text-xs text-[#6A6E73]">{t.sub}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
          {!fixedProject && (
            <div className="w-full sm:w-64">
              <ProjectSelect
                value={projectId}
                onChange={setProjectId}
                placeholder="Todos los proyectos"
              />
            </div>
          )}
          <NativeSelect
            className="w-auto"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            aria-label="Periodo"
          >
            {WINDOWS.map((w) => (
              <option key={w.days} value={w.days}>
                {w.label}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            className="w-auto"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            aria-label="Edad"
          >
            <option value="all">Edad: todas</option>
            {ages.map((a) => (
              <option key={a} value={a}>
                {a} días
              </option>
            ))}
          </NativeSelect>
          <FilterChips label="Estado" value={status} options={STATUS_CHIPS} onChange={setStatus} />
          <span className="ml-auto text-[13px] text-subtle">
            {rows.length} {rows.length === 1 ? 'ensayo' : 'ensayos'}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">No se pudieron cargar los ensayos.</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Check}
            title="No hay ensayos en esta vista"
            description={
              all.length
                ? 'Ningún ensayo coincide con los filtros.'
                : 'Los ensayos se programan al completar cada registro de campo.'
            }
            actions={
              all.length ? (
                <Button variant="outline" size="sm" onClick={clear}>
                  Quitar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <PendingTable
                rows={rows}
                today={today}
                showProject={!fixedProject}
                onReschedule={setEditing}
              />
            </div>
            <div className="md:hidden">
              {rows.map((t) => (
                <PendingCard key={t.id} test={t} today={today} onReschedule={setEditing} />
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={`Reprogramar espécimen ${editing?.specimen.specimenNumber ?? ''}`}
        description={
          editing
            ? `Colado ${formatDateLong(editing.fieldRecord.pourDate)} · registro ${editing.fieldRecord.registryNumber ?? ''}`
            : undefined
        }
      >
        {editing && (
          <RescheduleForm
            testId={editing.id}
            ageDays={editing.ageDays}
            keepExactDate={editing.keepExactDate}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

function ScheduledDate({ test }: { test: PendingTest }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      {formatDateLong(test.scheduledDate)}
      {test.scheduledDate !== test.nominalDate && (
        <span
          className="text-subtle"
          title={`Le tocaba el ${formatDateLong(test.nominalDate)} (domingo o festivo)`}
          aria-label="Fecha recorrida por domingo o festivo"
        >
          <CalendarDays className="h-3.5 w-3.5" />
        </span>
      )}
      {test.keepExactDate && (
        <Badge tone="outline" plain>
          exacta
        </Badge>
      )}
    </span>
  );
}

/** Due tests are recorded on today's worksheet; later ones can only be looked at. */
function worksheetHref(t: PendingTest, today: string): string | null {
  return t.dueStatus === 'UPCOMING'
    ? null
    : `/tests/worksheet?projectId=${t.project.id}&date=${today}`;
}

function PendingTable({
  rows,
  today,
  showProject,
  onReschedule,
}: {
  rows: PendingTest[];
  today: string;
  showProject: boolean;
  onReschedule: (test: PendingTest) => void;
}) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow>
          <TableHead>{showProject ? 'Proyecto' : 'Elemento'}</TableHead>
          <TableHead className="w-28">Registro</TableHead>
          <TableHead className="w-20">Muestra</TableHead>
          <TableHead className="w-24">Espécimen</TableHead>
          <TableHead className="w-20">Edad</TableHead>
          <TableHead className="w-40">Fecha programada</TableHead>
          <TableHead className="w-28">Estado</TableHead>
          <TableHead className="w-44 text-right">Acción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((t) => {
          const look = DUE_STATUS[t.dueStatus];
          return (
            <TableRow key={t.id} className={ROW_BG[t.dueStatus]}>
              <TableCell className="h-[52px]">
                <span className="flex flex-col leading-snug">
                  {showProject && <span className="font-medium">{t.project.name}</span>}
                  <span className={showProject ? 'text-xs text-[#6A6E73]' : ''}>
                    {t.fieldRecord.castElement ?? '—'}
                  </span>
                </span>
              </TableCell>
              <TableCell className="font-mono text-[13px] text-muted-foreground">
                {t.fieldRecord.registryNumber ?? '—'}
              </TableCell>
              <TableCell className="font-mono text-[13px]">
                {t.sample.sampleNumber ?? '—'}
              </TableCell>
              <TableCell className="font-mono text-[13px] font-medium">
                {t.specimen.specimenNumber ?? '—'}
                {t.specimen.moldCode && (
                  <span className="ml-1 font-normal text-subtle">({t.specimen.moldCode})</span>
                )}
              </TableCell>
              <TableCell>{t.ageDays} días</TableCell>
              <TableCell>
                <ScheduledDate test={t} />
              </TableCell>
              <TableCell>
                <Badge tone={look.tone}>{look.label}</Badge>
              </TableCell>
              <TableCell>
                <span className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="xs" onClick={() => onReschedule(t)}>
                    Cambiar edad
                  </Button>
                  {worksheetHref(t, today) ? (
                    <Button size="xs" asChild>
                      <Link href={worksheetHref(t, today) as string}>Registrar ensayo</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="xs" asChild>
                      <Link href={`/field-records/${t.fieldRecord.id}`}>Ver registro</Link>
                    </Button>
                  )}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function PendingCard({
  test: t,
  today,
  onReschedule,
}: {
  test: PendingTest;
  today: string;
  onReschedule: (test: PendingTest) => void;
}) {
  const look = DUE_STATUS[t.dueStatus];
  return (
    <div
      className={cn('flex flex-col gap-2.5 border-b border-row px-4 py-3.5', ROW_BG[t.dueStatus])}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <div className="font-mono text-[15px] font-medium">
            Esp. {t.specimen.specimenNumber ?? '—'}{' '}
            <span className="text-[13px] text-[#6A6E73]">
              · Muestra {t.sample.sampleNumber ?? '—'}
            </span>
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {t.project.name} · {t.fieldRecord.registryNumber ?? '—'}
          </div>
        </div>
        <Badge tone={look.tone}>{look.label}</Badge>
      </div>
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[13px]">
          {t.ageDays} días · <ScheduledDate test={t} />
        </span>
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onReschedule(t)}>
            Cambiar edad
          </Button>
          {worksheetHref(t, today) ? (
            <Button size="sm" asChild>
              <Link href={worksheetHref(t, today) as string}>Registrar</Link>
            </Button>
          ) : (
            <Button variant="outline" size="icon" asChild aria-label="Ver registro">
              <Link href={`/field-records/${t.fieldRecord.id}`}>
                <ChevronRight />
              </Link>
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}
