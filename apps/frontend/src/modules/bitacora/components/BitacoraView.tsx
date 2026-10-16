'use client';

import { BookOpen, Download, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { formatDateNumeric } from '@/lib/utils/formatters';
import { useBitacora, useExportBitacora } from '../hooks/useBitacora';
import type { BitacoraRecord, BitacoraSample } from '../types/bitacora.types';

const HEADERS = [
  'Informe',
  'Fecha de muestreo',
  'Proveedor',
  'Hecho en obra',
  'Premezclado',
  "f'c de proyecto (kg/cm²)",
  'Rev. de proyecto (cm)',
  'T.M.A. (cm)',
  'Elemento colado',
  'No. muestra',
  'Hora de elaboración',
  'Revenimientos (cm)',
  'Temperatura (°C)',
  'Masa unitaria (kg/m³)',
  'Contenido de aire (%)',
  'Espécimen',
  'Edad (días)',
  'Fecha de ensayo',
  'Carga máxima (kgf)',
  'Área (cm²)',
  'Esfuerzo (kg/cm²)',
  '% de resistencia',
];

const fx = (v: number | null, d: number) => (v === null ? '—' : v.toFixed(d));

function slumps(s: BitacoraSample): string {
  // Both readings when the test was repeated, never an average (Q-66).
  const v = [s.slump1Cm, s.slump2Cm].filter((x): x is number => x !== null);
  return v.length ? v.map((x) => x.toFixed(1)).join(' / ') : '—';
}

function matches(r: BitacoraRecord, q: string): boolean {
  if (!q) return true;
  const text = [
    r.registryNumber,
    r.castElement,
    ...r.samples.map((s) => s.sampleNumber),
    ...r.samples.flatMap((s) => s.specimens.map((sp) => sp.specimenNumber)),
  ]
    .filter((x) => x !== null)
    .join(' ')
    .toLowerCase();
  return text.includes(q.toLowerCase());
}

/**
 * The Bitácora of one project (FPC01-02): one row per specimen, record and sample data
 * in merged cells, results derived by the server. Read only (ADR-004).
 */
export function BitacoraView({ projectId }: { projectId: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useBitacora(projectId, {
    from: from || undefined,
    to: to || undefined,
  });
  const exportXlsx = useExportBitacora();

  const records = (data?.records ?? []).filter((r) => matches(r, search.trim()));
  const s = data?.summary;
  const pct = s && s.specimens ? Math.round((s.tested / s.specimens) * 100) : 0;
  const tiles = [
    { label: 'Registros', value: s?.records ?? 0 },
    { label: 'Muestras', value: s?.samples ?? 0 },
    { label: 'Especímenes', value: s?.specimens ?? 0 },
    { label: 'Ensayados', value: s ? `${s.tested} (${pct}%)` : '0' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] overflow-hidden rounded-lg border bg-card print:hidden">
        {tiles.map((t) => (
          <div key={t.label} className="px-4 py-3.5 shadow-[inset_-1px_-1px_0_var(--border)]">
            <div className="text-[13px] text-muted-foreground">{t.label}</div>
            <div className="mt-1 font-mono text-2xl font-medium">{isLoading ? '—' : t.value}</div>
          </div>
        ))}
      </div>

      {data && (
        <div className="hidden text-[11px] print:block">
          <p className="text-center text-xs font-semibold uppercase">
            Bitácora electrónica de ensayos de concreto hidráulico · FPC01-02
          </p>
          <p className="mt-1">
            Obra: {data.project.name} · Solicitante: {data.project.client.name}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card print:rounded-none print:border-0">
        <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3 print:hidden">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar registro, muestra, espécimen…"
          />
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            Colado desde
            <Input
              type="date"
              className="w-40"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            hasta
            <Input
              type="date"
              className="w-40"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer />
              Imprimir
            </Button>
            <Button
              variant="outline"
              disabled={exportXlsx.isPending}
              onClick={() =>
                exportXlsx.mutate({
                  projectId,
                  fileName: `Bitacora-${data?.project.code ?? 'proyecto'}.xlsx`,
                })
              }
            >
              {exportXlsx.isPending ? <Loader2 className="animate-spin" /> : <Download />}
              Exportar a Excel
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-11/12" />
          </div>
        ) : isError ? (
          <p className="p-4 text-sm text-destructive">No se pudo cargar la Bitácora.</p>
        ) : records.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={data?.records.length ? 'Ningún registro coincide' : 'La Bitácora está vacía'}
            description={
              data?.records.length
                ? 'Cambia la búsqueda o el rango de fechas.'
                : 'Se llena sola con los registros de campo completados y los resultados de sus ensayos.'
            }
          />
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[1700px] border-collapse text-[13px] print:min-w-0 print:text-[8px]">
              <thead className="bg-surface text-[11px] text-muted-foreground">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="border-b border-r border-row px-2 py-2 text-center font-medium leading-tight last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <RecordRows key={r.id} record={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordRows({ record: r }: { record: BitacoraRecord }) {
  const spanOf = (s: BitacoraSample) => Math.max(1, s.specimens.length);
  const recordSpan = r.samples.reduce((n, s) => n + spanOf(s), 0) || 1;
  const td = 'border-b border-r border-row px-2 py-1.5 text-center align-middle';

  const rows: React.ReactNode[] = [];
  r.samples.forEach((s, si) => {
    const specimens = s.specimens.length ? s.specimens : [null];
    specimens.forEach((sp, k) => {
      const firstOfRecord = si === 0 && k === 0;
      const firstOfSample = k === 0;
      rows.push(
        <tr key={`${s.id}:${sp?.id ?? 'none'}`} className="hover:bg-[#F8F8F6]">
          {firstOfRecord && (
            <>
              <td rowSpan={recordSpan} className={cn(td, 'whitespace-nowrap font-mono')}>
                <Link
                  href={`/field-records/${r.id}`}
                  className="text-primary print:text-foreground"
                >
                  {r.registryNumber ?? '—'}
                </Link>
              </td>
              <td rowSpan={recordSpan} className={cn(td, 'tabular-nums')}>
                {formatDateNumeric(r.pourDate)}
              </td>
              <td rowSpan={recordSpan} className={td}>
                {r.supplier ?? '—'}
              </td>
              <td rowSpan={recordSpan} className={td}>
                {r.production === 'SITE_MIXED' ? 'X' : ''}
              </td>
              <td rowSpan={recordSpan} className={td}>
                {r.production === 'READY_MIXED' ? 'X' : ''}
              </td>
              <td rowSpan={recordSpan} className={cn(td, 'font-mono')}>
                {r.specifiedStrengthKgCm2 ?? '—'}
              </td>
              <td rowSpan={recordSpan} className={cn(td, 'font-mono whitespace-nowrap')}>
                {r.specifiedSlumpCm === null
                  ? '—'
                  : `${r.specifiedSlumpCm.toFixed(1)}${r.specifiedSlumpToleranceCm !== null ? ` ± ${r.specifiedSlumpToleranceCm.toFixed(1)}` : ''}`}
              </td>
              <td rowSpan={recordSpan} className={cn(td, 'font-mono')}>
                {fx(r.maxAggregateSizeCm, 1)}
              </td>
              <td rowSpan={recordSpan} className={cn(td, 'min-w-[200px] text-left')}>
                {r.castElement ?? '—'}
              </td>
            </>
          )}
          {firstOfSample && (
            <>
              <td rowSpan={spanOf(s)} className={cn(td, 'font-mono')}>
                {s.sampleNumber ?? '—'}
              </td>
              <td rowSpan={spanOf(s)} className={cn(td, 'font-mono')}>
                {s.moldedAt ?? '—'}
              </td>
              <td rowSpan={spanOf(s)} className={cn(td, 'font-mono whitespace-nowrap')}>
                {slumps(s)}
              </td>
              <td rowSpan={spanOf(s)} className={cn(td, 'font-mono')}>
                {fx(s.concreteTemperatureC, 1)}
              </td>
            </>
          )}
          {firstOfRecord && (
            <>
              <td rowSpan={recordSpan} className={cn(td, 'font-mono')}>
                {r.unitWeightKgM3 ?? '-'}
              </td>
              <td rowSpan={recordSpan} className={cn(td, 'font-mono')}>
                {r.airContentPct === null ? '-' : r.airContentPct.toFixed(1)}
              </td>
            </>
          )}
          <td className={cn(td, 'font-mono font-semibold')}>{sp?.specimenNumber ?? '—'}</td>
          <td className={td}>{sp?.ageDays ?? '—'}</td>
          <td
            className={cn(td, 'tabular-nums', sp && !sp.tested && 'italic text-subtle')}
            title={sp && !sp.tested ? 'Fecha programada (sin ensayar)' : undefined}
          >
            {sp?.date ? formatDateNumeric(sp.date) : '—'}
          </td>
          <td className={cn(td, 'font-mono')}>
            {sp?.maxLoadKgf != null ? sp.maxLoadKgf.toLocaleString('es-MX') : ''}
          </td>
          <td className={cn(td, 'font-mono')}>
            {sp?.areaCm2 != null ? sp.areaCm2.toFixed(2) : ''}
          </td>
          <td className={cn(td, 'font-mono font-semibold')}>{sp?.stressKgCm2 ?? ''}</td>
          <td className={cn(td, 'border-r-0 font-mono')}>
            {sp?.percentOfDesign != null ? sp.percentOfDesign.toFixed(1) : ''}
          </td>
        </tr>
      );
    });
  });
  return <>{rows}</>;
}
