'use client';

import { Info, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToday } from '@/lib/hooks/useToday';
import { addDays, formatDateNumeric, formatDateShort } from '@/lib/utils/formatters';
import { useSaveTestConfiguration, useTestConfiguration } from '../hooks/useProjects';
import type { TestAge } from '../types/project.types';

interface Row {
  ageDays: string;
  specimenCount: number;
}

const toRows = (ages: TestAge[]): Row[] =>
  ages.map((a) => ({ ageDays: String(a.ageDays), specimenCount: a.specimenCount }));

/**
 * The project's default test ages (Q-20). No closed list (Q-19): the user types them.
 * Changing them doesn't move tests already planned; each test can still be changed (Q-22).
 */
export function TestAgesCard({ projectId }: { projectId: string }) {
  const { data, isLoading } = useTestConfiguration(projectId);
  if (isLoading || !data) return <Skeleton className="h-48 w-full max-w-[860px]" />;
  // key: reset the rows after each save.
  return <TestAgesEditor key={JSON.stringify(data)} projectId={projectId} saved={data} />;
}

function TestAgesEditor({ projectId, saved }: { projectId: string; saved: TestAge[] }) {
  const save = useSaveTestConfiguration(projectId);
  const today = useToday();
  const [rows, setRows] = useState<Row[]>(() => toRows(saved));

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const parsed = rows.map((r) => ({ ageDays: Number(r.ageDays), specimenCount: r.specimenCount }));
  const invalid = parsed.some((a) => !Number.isInteger(a.ageDays) || a.ageDays < 1);
  const repeated = new Set(parsed.map((a) => a.ageDays)).size !== parsed.length;
  const dirty = JSON.stringify(toRows(saved)) !== JSON.stringify(rows);
  const total = parsed.reduce((sum, a) => sum + a.specimenCount, 0);

  return (
    <section className="max-w-[860px] overflow-hidden rounded-lg border bg-card">
      <header className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">Edades de ensayo</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Edades y número de especímenes que se programan al completar cada registro de campo de
          este proyecto. Los de menor número van a la primera edad.
        </p>
      </header>
      <div className="mx-5 mb-1 mt-4 flex items-start gap-2.5 rounded-md border border-st-progress-bd bg-accent px-3 py-2.5 text-[13px] text-accent-foreground">
        <Info className="mt-px h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span>
          La fecha de cada ensayo es la fecha de colado más la edad, recorrida por domingos y días
          festivos. Después se puede cambiar la edad de cada espécimen mientras no se ensaye.
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="mt-3 grid h-9 grid-cols-[minmax(120px,1fr)_170px_170px_44px] items-center gap-3 border-b px-5 text-xs font-medium text-muted-foreground">
            <span>Edad (días)</span>
            <span>Número de especímenes</span>
            <span>Ejemplo (colado {formatDateShort(today)})</span>
            <span />
          </div>
          {rows.length === 0 && (
            <p className="border-b border-row px-5 py-4 text-sm text-muted-foreground">
              Sin edades configuradas. Normalmente 2 especímenes por edad, p. ej. 7 y 28 días.
            </p>
          )}
          {rows.map((row, i) => {
            const age = Number(row.ageDays);
            const valid = Number.isInteger(age) && age >= 1;
            return (
              <div
                key={i}
                className="grid min-h-14 grid-cols-[minmax(120px,1fr)_170px_170px_44px] items-center gap-3 border-b border-row px-5 text-sm"
              >
                <Input
                  type="number"
                  min={1}
                  className="h-8 w-24 font-mono font-semibold"
                  value={row.ageDays}
                  onChange={(e) => set(i, { ageDays: e.target.value })}
                  aria-label={`Edad ${i + 1} en días`}
                  aria-invalid={!valid && row.ageDays !== ''}
                />
                <span className="inline-flex w-max overflow-hidden rounded-md border border-input">
                  <button
                    type="button"
                    className="h-8 w-8 bg-surface text-base text-sidebar-foreground disabled:opacity-40"
                    onClick={() => set(i, { specimenCount: row.specimenCount - 1 })}
                    disabled={row.specimenCount <= 1}
                    aria-label="Uno menos"
                  >
                    −
                  </button>
                  <span className="w-10 border-x text-center font-mono text-sm leading-8">
                    {row.specimenCount}
                  </span>
                  <button
                    type="button"
                    className="h-8 w-8 bg-surface text-base text-sidebar-foreground"
                    onClick={() => set(i, { specimenCount: row.specimenCount + 1 })}
                    aria-label="Uno más"
                  >
                    +
                  </button>
                </span>
                <span className="font-mono text-[13px] text-muted-foreground">
                  {valid ? formatDateNumeric(addDays(today, age)) : '—'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-subtle hover:bg-muted"
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  aria-label={`Quitar edad ${i + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {repeated && <p className="px-5 pt-3 text-sm text-st-late-fg">Hay edades repetidas.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface px-5 py-3.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed border-dash-strong text-primary"
          onClick={() => setRows((rs) => [...rs, { ageDays: '', specimenCount: 2 }])}
        >
          + Agregar edad de ensayo
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-muted-foreground">
            <span className="font-mono text-foreground">{total}</span> especímenes por muestra
          </span>
          <Button
            type="button"
            disabled={!dirty || invalid || repeated || save.isPending}
            onClick={() => save.mutate([...parsed].sort((a, b) => a.ageDays - b.ageDays))}
          >
            {save.isPending && <Loader2 className="animate-spin" />}
            Guardar configuración
          </Button>
        </div>
      </div>
    </section>
  );
}
