'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSaveTestConfiguration, useTestConfiguration } from '../hooks/useProjects';
import type { TestAge } from '../types/project.types';

interface Row {
  ageDays: string;
  specimenCount: string;
}

const toRows = (ages: TestAge[]): Row[] =>
  ages.map((a) => ({ ageDays: String(a.ageDays), specimenCount: String(a.specimenCount) }));

/**
 * The project's default test ages (Q-20). No closed list (Q-19): the user types them.
 * Changing them doesn't move tests already planned; each test can still be changed (Q-22).
 */
export function TestAgesCard({ projectId }: { projectId: string }) {
  const { data, isLoading } = useTestConfiguration(projectId);
  if (isLoading || !data) return <Skeleton className="h-40 w-full max-w-2xl" />;
  // key: reset the rows after each save.
  return <TestAgesEditor key={JSON.stringify(data)} projectId={projectId} saved={data} />;
}

function TestAgesEditor({ projectId, saved }: { projectId: string; saved: TestAge[] }) {
  const save = useSaveTestConfiguration(projectId);
  const [rows, setRows] = useState<Row[]>(() => toRows(saved));

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const parsed = rows.map((r) => ({
    ageDays: Number(r.ageDays),
    specimenCount: Number(r.specimenCount),
  }));
  const invalid = parsed.some(
    (a) =>
      !Number.isInteger(a.ageDays) ||
      a.ageDays < 1 ||
      !Number.isInteger(a.specimenCount) ||
      a.specimenCount < 1
  );
  const repeated = new Set(parsed.map((a) => a.ageDays)).size !== parsed.length;
  const dirty = JSON.stringify(toRows(saved)) !== JSON.stringify(rows);
  const total = parsed.reduce((sum, a) => sum + (a.specimenCount || 0), 0);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Edades de ensayo</CardTitle>
        <CardDescription>
          Se usan al completar cada registro de campo: los especímenes de menor número van a la
          primera edad. Después se puede cambiar la edad de cada espécimen mientras no se ensaye.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sin edades configuradas. Normalmente 2 especímenes por edad, p. ej. 7 y 28 días.
          </p>
        )}
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              min={1}
              className="h-9 w-24"
              value={row.ageDays}
              onChange={(e) => set(i, { ageDays: e.target.value })}
              aria-label={`Edad ${i + 1} en días`}
            />
            <span className="text-muted-foreground">días ·</span>
            <Input
              type="number"
              min={1}
              className="h-9 w-20"
              value={row.specimenCount}
              onChange={(e) => set(i, { specimenCount: e.target.value })}
              aria-label={`Especímenes a la edad ${i + 1}`}
            />
            <span className="text-muted-foreground">especímenes</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              aria-label={`Quitar edad ${i + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {repeated && <p className="text-sm text-destructive">Hay edades repetidas.</p>}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((rs) => [...rs, { ageDays: '', specimenCount: '2' }])}
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar edad
          </Button>
          {rows.length > 0 && (
            <span className="text-xs text-muted-foreground">{total} especímenes por muestra</span>
          )}
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            disabled={!dirty || invalid || repeated || save.isPending}
            onClick={() => save.mutate([...parsed].sort((a, b) => a.ageDays - b.ageDays))}
          >
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar edades
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
