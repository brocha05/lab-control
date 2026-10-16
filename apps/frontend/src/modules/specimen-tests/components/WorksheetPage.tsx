'use client';

import { AlertTriangle, ClipboardList, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { useToday } from '@/lib/hooks/useToday';
import { getApiError } from '@/lib/utils/apiError';
import { cn } from '@/lib/utils/cn';
import { formatDateLong, formatDateNumeric } from '@/lib/utils/formatters';
import { ProjectSelect } from '@/modules/projects/components/ProjectSelect';
import { useUiStore } from '@/store/uiStore';
import { useSaveTestResults, useWorksheet } from '../hooks/useSpecimenTests';
import type {
  AgeToleranceResult,
  TestResultRow,
  Worksheet,
  WorksheetRow,
} from '../types/specimenTest.types';
import { usePermission } from '@/lib/hooks/usePermission';

const READING_KEYS = [
  'height1Cm',
  'height2Cm',
  'diameter1Cm',
  'diameter2Cm',
  'maxLoadKgf',
] as const;
type ReadingKey = (typeof READING_KEYS)[number];

const READING_LABELS: Record<ReadingKey, string> = {
  height1Cm: 'Altura 1 (cm)',
  height2Cm: 'Altura 2 (cm)',
  diameter1Cm: 'Diámetro 1 (cm)',
  diameter2Cm: 'Diámetro 2 (cm)',
  maxLoadKgf: 'Carga máxima (kgf)',
};

interface RowInput extends Record<ReadingKey, string> {
  testTime: string;
  loadDurationS: string;
  failureType: string;
}

const s = (v: number | string | null) => (v === null ? '' : String(v));

function toInput(row: WorksheetRow): RowInput {
  return {
    testTime: row.testTime ?? '',
    height1Cm: s(row.readings.height1Cm),
    height2Cm: s(row.readings.height2Cm),
    diameter1Cm: s(row.readings.diameter1Cm),
    diameter2Cm: s(row.readings.diameter2Cm),
    maxLoadKgf: s(row.readings.maxLoadKgf),
    loadDurationS: s(row.readings.loadDurationS),
    failureType: s(row.readings.failureType),
  };
}

const filled = (r: RowInput) => READING_KEYS.filter((k) => r[k].trim() !== '').length;

/**
 * "Hoja de ensayos": the FPC06-01 worksheet of one project and test date (7.4). The lab
 * types the press readings; results come back from the server, computed with
 * compression.ts (ADR-008), so nothing is calculated here.
 */
export function WorksheetPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = useToday();
  const currentProjectId = useUiStore((st) => st.currentProjectId);
  const projectId = params.get('projectId') ?? currentProjectId;
  const testDate = params.get('date') ?? today;
  const sheet = useWorksheet(projectId, testDate);
  const canCapture = usePermission('records.capture');

  useBreadcrumbs([
    { label: 'Ensayos pendientes', href: '/tests/pending' },
    { label: 'Hoja de ensayos' },
  ]);

  const go = (next: { projectId?: string; date?: string }) => {
    const q = new URLSearchParams({ projectId, date: testDate, ...next });
    router.replace(`${pathname}?${q.toString()}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        className="print:hidden"
        title="Hoja de ensayos"
        description="Registro de resultados de resistencia a la compresión (FPC06-01), por proyecto y fecha de ensayo"
      />

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card px-4 py-3 print:hidden">
        <div className="w-full space-y-1.5 sm:w-80">
          <Label htmlFor="wsProject" className="text-[13px] font-medium">
            Proyecto
          </Label>
          <ProjectSelect
            id="wsProject"
            value={projectId}
            onChange={(id) => go({ projectId: id })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wsDate" className="text-[13px] font-medium">
            Fecha de ensayos
          </Label>
          <Input
            id="wsDate"
            type="date"
            className="w-44"
            value={testDate}
            max={today}
            onChange={(e) => e.target.value && go({ date: e.target.value })}
          />
        </div>
      </div>

      {!projectId ? (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={ClipboardList}
            title="Selecciona un proyecto"
            description="La hoja reúne los especímenes de un proyecto que se ensayan en una fecha."
          />
        </div>
      ) : sheet.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !sheet.data ? (
        <p className="text-sm text-destructive">
          {getApiError(sheet.error)?.code === 'NOT_FOUND'
            ? 'El proyecto no existe.'
            : 'No se pudo cargar la hoja.'}
        </p>
      ) : (
        // key: start from the saved values after every save or change of sheet.
        <WorksheetEditor
          key={`${projectId}:${testDate}:${sheet.dataUpdatedAt}`}
          sheet={sheet.data}
          editable={testDate <= today && canCapture}
        />
      )}
    </div>
  );
}

function ToleranceBadge({ value }: { value: AgeToleranceResult | null }) {
  if (!value) return <span className="text-subtle">—</span>;
  if (value.status === 'WITHIN') return <Badge tone="done">Sí</Badge>;
  if (value.status === 'OUTSIDE')
    return (
      <Badge tone="late" title={`${value.actualHours?.toFixed(1)} h (±${value.toleranceHours} h)`}>
        No
      </Badge>
    );
  return (
    <span
      className="text-xs text-subtle"
      title={
        value.actualHours === null
          ? 'Captura la hora del ensayo para calcular la tolerancia'
          : 'La norma no da tolerancia para esta edad'
      }
    >
      {value.actualHours === null ? 'sin hora' : 'sin tolerancia'}
    </span>
  );
}

function WorksheetEditor({ sheet, editable }: { sheet: Worksheet; editable: boolean }) {
  const save = useSaveTestResults();
  const allRows = sheet.groups.flatMap((g) => g.rows);
  const initial = Object.fromEntries(allRows.map((r) => [r.id, toInput(r)]));
  const [inputs, setInputs] = useState<Record<string, RowInput>>(initial);
  const [pressCode, setPressCode] = useState(sheet.pressCode ?? '');
  const [dimensionEquipment, setDimensionEquipment] = useState(sheet.dimensionEquipment ?? '');
  const [tried, setTried] = useState(false);

  const set = (id: string, key: keyof RowInput, value: string) =>
    setInputs((all) => ({ ...all, [id]: { ...all[id], [key]: value } }));
  const isDirty = (id: string) => JSON.stringify(inputs[id]) !== JSON.stringify(initial[id]);
  const headerDirty =
    pressCode !== (sheet.pressCode ?? '') ||
    dimensionEquipment !== (sheet.dimensionEquipment ?? '');

  const problems: string[] = [];
  const toSave: TestResultRow[] = [];
  for (const row of allRows) {
    const input = inputs[row.id];
    const n = filled(input);
    const completed = row.status === 'COMPLETED';
    const relevant = isDirty(row.id) || (headerDirty && completed);
    if (!relevant) continue;
    if (n === 0 && !completed) continue;
    const label = `Espécimen ${row.specimen.specimenNumber ?? '—'}`;
    if (n < READING_KEYS.length) {
      problems.push(
        completed && n === 0
          ? `${label}: un resultado guardado no se puede borrar; cancela el espécimen si se dañó`
          : `${label}: faltan alturas, diámetros o carga`
      );
      continue;
    }
    toSave.push({
      testId: row.id,
      testTime: input.testTime || null,
      height1Cm: Number(input.height1Cm),
      height2Cm: Number(input.height2Cm),
      diameter1Cm: Number(input.diameter1Cm),
      diameter2Cm: Number(input.diameter2Cm),
      maxLoadKgf: Number(input.maxLoadKgf),
      loadDurationS: input.loadDurationS ? Number(input.loadDurationS) : null,
      failureType: input.failureType ? Number(input.failureType) : null,
    });
  }

  const submit = () => {
    setTried(true);
    if (problems.length || toSave.length === 0) return;
    save.mutate({
      testDate: sheet.testDate,
      pressCode: pressCode.trim() || null,
      dimensionEquipment: dimensionEquipment.trim() || null,
      rows: toSave,
    });
  };

  const checks = sheet.loadTimeChecks;
  const cell = 'h-8 w-[66px] px-1.5 text-right font-mono text-[13px]';

  if (sheet.groups.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={ClipboardList}
          title="No hay especímenes para esta fecha"
          description={`Ningún ensayo de ${sheet.project.name} vence el ${formatDateLong(sheet.testDate)} o antes.`}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/tests/pending">Ver ensayos pendientes</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Printed header, as on the paper form. */}
      <div className="hidden text-[11px] print:block">
        <p className="text-center text-xs font-semibold uppercase">
          Registro de resultados de resistencia a la compresión de especímenes ensayados (cilindros)
          · FPC06-01
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5">
          <span>Obra: {sheet.project.name}</span>
          <span>Solicitante: {sheet.project.client.name}</span>
          <span>Prensa: {pressCode || '—'}</span>
          <span>Dimensiones: {dimensionEquipment || '—'}</span>
          <span>Ecuación de corrección de carga: se utilizan lecturas directas</span>
          <span>Fecha de ensayos: {formatDateNumeric(sheet.testDate)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card px-4 py-3 print:hidden">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold">{sheet.project.name}</div>
          <div className="text-[13px] text-muted-foreground">
            {sheet.project.client.name} · ensayos del {formatDateLong(sheet.testDate)}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="wsPress" className="text-[13px] font-medium">
              Prensa
            </Label>
            <Input
              id="wsPress"
              className="w-36 font-mono"
              placeholder="CCP-PRE-05"
              value={pressCode}
              disabled={!editable}
              onChange={(e) => setPressCode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wsDims" className="text-[13px] font-medium">
              Dimensiones (equipo)
            </Label>
            <Input
              id="wsDims"
              className="w-56 font-mono"
              placeholder="CCP-FLX-01, CCP-RME-02"
              value={dimensionEquipment}
              disabled={!editable}
              onChange={(e) => setDimensionEquipment(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!editable && (
        <p className="rounded-md border border-st-today-bd bg-st-today px-3.5 py-2.5 text-sm text-st-today-fg print:hidden">
          Solo consulta e impresión: los resultados se capturan el día del ensayo, por un puesto que
          capture ensayos.
        </p>
      )}

      {sheet.groups.map((g) => (
        <section
          key={`${g.fieldRecord.id}:${g.sample.id}`}
          className="overflow-hidden rounded-lg border bg-card print:break-inside-avoid print:rounded-none"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3">
            <h2 className="text-sm font-semibold uppercase">
              {g.fieldRecord.castElement ?? 'Elemento sin nombre'}
              {g.sample.moldedAt && <span className="font-mono"> — {g.sample.moldedAt}</span>}
            </h2>
            <span className="text-[13px] text-muted-foreground">
              <Link href={`/field-records/${g.fieldRecord.id}`} className="font-mono text-primary">
                {g.fieldRecord.registryNumber ?? 'Sin número'}
              </Link>{' '}
              · muestra <span className="font-mono">{g.sample.sampleNumber ?? '—'}</span> · colado{' '}
              {formatDateLong(g.fieldRecord.pourDate)} · f&apos;c{' '}
              <span className="font-mono">{g.fieldRecord.specifiedStrengthKgCm2 ?? '—'}</span>{' '}
              kg/cm²
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-surface text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="h-9 px-3 text-left font-medium">Clave</th>
                  <th className="px-2 text-left font-medium">Edad</th>
                  <th className="px-2 text-left font-medium">Hora</th>
                  <th className="px-1 text-center font-medium" colSpan={2}>
                    Altura (cm)
                  </th>
                  <th className="px-1 text-center font-medium" colSpan={2}>
                    Diámetro (cm)
                  </th>
                  <th className="px-1 text-right font-medium">Carga (kgf)</th>
                  <th className="px-1 text-right font-medium">Tiempo (s)</th>
                  <th className="px-2 text-left font-medium">Falla</th>
                  <th className="px-2 text-right font-medium">Área (cm²)</th>
                  <th className="px-2 text-right font-medium">Carga (N)</th>
                  <th className="px-2 text-right font-medium">kgf/cm²</th>
                  <th className="px-2 text-right font-medium">% f&apos;c</th>
                  <th className="px-3 text-left font-medium">Tol. edad</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((row) => {
                  const input = inputs[row.id];
                  const dirty = isDirty(row.id);
                  const n = filled(input);
                  const partial = tried && n > 0 && n < READING_KEYS.length;
                  const shown = !dirty && row.result;
                  const late = row.status !== 'COMPLETED' && row.scheduledDate < sheet.testDate;
                  return (
                    <tr
                      key={row.id}
                      className={cn('border-b border-row last:border-0', dirty && 'bg-accent-soft')}
                    >
                      <td className="h-11 px-3">
                        <span className="font-mono font-semibold">
                          {row.specimen.specimenNumber ?? '—'}
                        </span>
                        {row.status === 'COMPLETED' && !dirty && (
                          <Badge tone="done" plain className="ml-2 print:hidden">
                            guardado
                          </Badge>
                        )}
                        {late && (
                          <Badge tone="late" plain className="ml-2 print:hidden">
                            atrasado
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 whitespace-nowrap">
                        {row.ageDays} d
                        {row.actualAgeDays !== row.ageDays && (
                          <span className="ml-1 text-xs text-st-today-fg" title="Edad real">
                            ({row.actualAgeDays} d)
                          </span>
                        )}
                      </td>
                      <td className="px-2">
                        <Input
                          type="time"
                          className="h-8 w-[104px] px-1.5 font-mono text-[13px]"
                          value={input.testTime}
                          disabled={!editable}
                          aria-label="Hora del ensayo"
                          onChange={(e) => set(row.id, 'testTime', e.target.value)}
                        />
                      </td>
                      {READING_KEYS.map((k) => (
                        <td key={k} className="px-1">
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            inputMode="decimal"
                            className={cn(cell, k === 'maxLoadKgf' && 'w-[84px]')}
                            value={input[k]}
                            disabled={!editable}
                            aria-invalid={partial && input[k].trim() === ''}
                            aria-label={READING_LABELS[k]}
                            onChange={(e) => set(row.id, k, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-1">
                        <Input
                          type="number"
                          step="1"
                          min={1}
                          className={cn(cell, 'w-[60px]')}
                          value={input.loadDurationS}
                          disabled={!editable}
                          aria-label="Tiempo de carga (s)"
                          onChange={(e) => set(row.id, 'loadDurationS', e.target.value)}
                        />
                      </td>
                      <td className="px-2">
                        <select
                          className="h-8 w-[58px] rounded-md border border-input bg-card px-1 font-mono text-[13px] disabled:opacity-70"
                          value={input.failureType}
                          disabled={!editable}
                          aria-label="Tipo de falla"
                          onChange={(e) => set(row.id, 'failureType', e.target.value)}
                        >
                          <option value="">—</option>
                          {[1, 2, 3, 4, 5, 6].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      {shown && row.result ? (
                        <>
                          <td className="px-2 text-right font-mono">
                            {row.result.areaCm2.toFixed(1)}
                          </td>
                          <td className="px-2 text-right font-mono">
                            {row.result.maxLoadN.toLocaleString('es-MX')}
                          </td>
                          <td className="px-2 text-right font-mono font-semibold">
                            {row.result.stressKgCm2}
                          </td>
                          <td className="px-2 text-right font-mono">
                            {row.result.percentOfDesign.toFixed(1)}
                          </td>
                          <td className="px-3">
                            <ToleranceBadge value={row.ageTolerance} />
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="px-3 text-xs text-subtle">
                          {dirty && n === READING_KEYS.length ? 'Guarda para calcular' : ''}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground print:hidden">
        <span>
          Tiempo de carga medido en{' '}
          <span className="font-mono text-foreground">{checks.measured}</span> de{' '}
          <span className="font-mono text-foreground">{checks.tested}</span> ensayados (mínimo{' '}
          <span className="font-mono text-foreground">{checks.required}</span>, 1 de cada 10).
        </span>
        {checks.measured < checks.required && <Badge tone="today">Falta medir el tiempo</Badge>}
      </div>

      {tried && problems.length > 0 && (
        <div className="rounded-md border border-st-late-bd bg-st-late px-3.5 py-3 text-sm text-st-late-fg print:hidden">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />
            Revisa estos renglones antes de guardar
          </p>
          <ul className="mt-1.5 list-inside list-disc">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-lg border bg-surface px-4 py-3 print:hidden">
        <span className="flex-1 text-xs text-subtle">
          {toSave.length
            ? `${toSave.length} ${toSave.length === 1 ? 'renglón listo' : 'renglones listos'} para guardar`
            : 'Captura alturas, diámetros y carga de cada espécimen ensayado'}
        </span>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          Imprimir hoja
        </Button>
        {editable && (
          <Button
            onClick={submit}
            disabled={save.isPending || (toSave.length === 0 && !problems.length)}
          >
            {save.isPending && <Loader2 className="animate-spin" />}
            Guardar resultados
          </Button>
        )}
      </div>

      {/* Signed on paper (Q-69, A-91). */}
      <div className="mt-12 hidden justify-around text-center text-[11px] print:flex">
        {['Jefe de laboratorio', 'Coordinador del SGC'].map((role) => (
          <div key={role} className="w-56 border-t border-foreground pt-1">
            {role}
          </div>
        ))}
      </div>
    </div>
  );
}
