'use client';

import { CalendarClock, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCalendarDate } from '@/lib/utils/formatters';
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

const GROUPS: { status: DueStatus; title: string; tone: string }[] = [
  { status: 'OVERDUE', title: 'Atrasados', tone: 'text-destructive' },
  { status: 'DUE_TODAY', title: 'Hoy', tone: 'text-primary' },
  { status: 'UPCOMING', title: 'Próximos', tone: 'text-foreground' },
];

/** `YYYY-MM-DD` of today + n days in the browser's calendar (close enough for a filter). */
function dateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function PendingTestsPage() {
  const [projectId, setProjectId] = useState('');
  const [windowDays, setWindowDays] = useState(7);
  const [editing, setEditing] = useState<PendingTest | null>(null);
  const { data, isLoading, isError } = usePendingTests({
    until: dateInDays(windowDays),
    projectId: projectId || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pruebas pendientes"
        description="Especímenes por ensayar, con la fecha ya recorrida por domingos y días festivos"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-md">
          <ProjectSelect value={projectId} onChange={setProjectId} placeholder="Todas las obras" />
        </div>
        <NativeSelect
          className="sm:w-48"
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
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <p className="text-sm text-destructive">No se pudieron cargar las pruebas pendientes.</p>
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="Sin pruebas pendientes"
            description="Los ensayes se programan al completar cada registro de campo."
          />
        </Card>
      ) : (
        GROUPS.map((group) => {
          const items = data.filter((t) => t.dueStatus === group.status);
          if (items.length === 0) return null;
          return (
            <Card key={group.status}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-base ${group.tone}`}>
                  {group.title} <span className="text-muted-foreground">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <PendingTable items={items} onReschedule={setEditing} />
              </CardContent>
            </Card>
          );
        })
      )}

      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={`Reprogramar espécimen ${editing?.specimen.specimenNumber ?? ''}`}
        description={
          editing
            ? `Colado ${formatCalendarDate(editing.fieldRecord.pourDate)} · registro ${editing.fieldRecord.registryNumber ?? ''}`
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
    </div>
  );
}

function PendingTable({
  items,
  onReschedule,
}: {
  items: PendingTest[];
  onReschedule: (test: PendingTest) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-36">Fecha</TableHead>
          <TableHead className="w-20">Edad</TableHead>
          <TableHead className="w-28">Espécimen</TableHead>
          <TableHead className="w-24">Muestra</TableHead>
          <TableHead className="w-28">Registro</TableHead>
          <TableHead>Obra · elemento</TableHead>
          <TableHead className="w-28" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((t) => (
          <TableRow key={t.id}>
            <TableCell>
              {formatCalendarDate(t.scheduledDate)}
              {t.scheduledDate !== t.nominalDate && (
                <span
                  className="ml-1 inline-flex items-center text-xs text-muted-foreground"
                  title={`Le tocaba el ${formatCalendarDate(t.nominalDate)} (domingo o festivo)`}
                >
                  <CalendarDays className="h-3 w-3" />
                </span>
              )}
              {t.keepExactDate && (
                <Badge variant="outline" className="ml-1">
                  exacta
                </Badge>
              )}
            </TableCell>
            <TableCell>{t.ageDays} d</TableCell>
            <TableCell className="font-mono text-xs">
              {t.specimen.specimenNumber ?? '—'}
              {t.specimen.moldCode && (
                <span className="ml-1 text-muted-foreground">({t.specimen.moldCode})</span>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">{t.sample.sampleNumber ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">
              <Link href={`/field-records/${t.fieldRecord.id}`} className="hover:underline">
                {t.fieldRecord.registryNumber ?? '—'}
              </Link>
            </TableCell>
            <TableCell className="max-w-sm truncate">
              <span className="font-medium">{t.project.code ?? t.project.name}</span>
              {t.fieldRecord.castElement && (
                <span className="text-muted-foreground"> · {t.fieldRecord.castElement}</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onReschedule(t)}>
                Cambiar edad
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
