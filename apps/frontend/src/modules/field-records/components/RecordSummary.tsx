'use client';

import { formatDateLong } from '@/lib/utils/formatters';
import { useCatalog } from '@/modules/catalogs/hooks/useCatalogs';
import type { FieldRecordValues } from '../schemas/fieldRecord.form';
import {
  LIGHTING_LABELS,
  PRODUCTION_LABELS,
  SKY_LABELS,
  STRENGTH_LABELS,
  WIND_LABELS,
} from '../schemas/fieldRecord.labels';

type Item = { k: string; v: string; mono?: boolean };

const or = (v: string, suffix = '') => (v.trim() ? `${v}${suffix}` : '—');
const label = <K extends string>(map: Record<K, string>, v: string) =>
  v ? (map[v as K] ?? v) : '—';

function Card({ title, items, onEdit }: { title: string; items: Item[]; onEdit?: () => void }) {
  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between border-b border-row px-3.5 py-2.5">
        <span className="text-[13px] font-semibold">{title}</span>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-xs font-medium text-primary">
            Editar
          </button>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-3.5 py-2.5 text-[13px]">
        {items.map((i) => (
          <div key={i.k} className="contents">
            <dt className="text-[#6A6E73]">{i.k}</dt>
            <dd className={`text-right font-medium ${i.mono ? 'font-mono' : ''}`}>{i.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Key data of a record by sheet block, plus the deliveries table. Used to review a draft
 * before completing it and to show a completed record.
 */
export function RecordSummary({
  values,
  onEditStep,
}: {
  values: FieldRecordValues;
  /** When given, each card links back to its step. */
  onEditStep?: (step: number) => void;
}) {
  const suppliers = useCatalog('suppliers');
  const cements = useCatalog('cement-types');
  const nameOf = (list: { id: string; name: string }[] | undefined, id: string) =>
    id ? (list?.find((x) => x.id === id)?.name ?? '—') : '—';
  const edit = (n: number) => (onEditStep ? () => onEditStep(n) : undefined);
  const strength = values.strengthCriterion
    ? `${label(STRENGTH_LABELS, values.strengthCriterion)} ${or(values.specifiedStrengthKgCm2, ' kg/cm²')}`
    : or(values.specifiedStrengthKgCm2, ' kg/cm²');
  const slump = values.specifiedSlumpCm
    ? `${values.specifiedSlumpCm}${values.specifiedSlumpToleranceCm ? ` ± ${values.specifiedSlumpToleranceCm}` : ''} cm`
    : '—';
  const samples = values.deliveries.flatMap((d, i) =>
    d.samples.map((s) => ({ ...s, delivery: i + 1 }))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <Card
          title="Información general"
          onEdit={edit(1)}
          items={[
            { k: 'Registro', v: or(values.registrySequence), mono: true },
            { k: 'Frente', v: or(values.frontNumber), mono: true },
            { k: 'Fecha de colado', v: formatDateLong(values.pourDate) },
            { k: 'Proveedor', v: nameOf(suppliers.data, values.supplierId) },
            { k: 'Concreto', v: label(PRODUCTION_LABELS, values.production) },
            { k: 'Elemento colado', v: or(values.castElement) },
            { k: 'Muestreador', v: or(values.samplerName) },
          ]}
        />
        <Card
          title="Concreto"
          onEdit={edit(2)}
          items={[
            { k: 'Resistencia', v: strength, mono: true },
            { k: 'Revenimiento', v: slump, mono: true },
            { k: 'TMA', v: or(values.maxAggregateSizeMm, ' mm'), mono: true },
            { k: 'Tipo de cemento', v: nameOf(cements.data, values.cementTypeId) },
            { k: 'Edad definitiva', v: or(values.designAgeDays, ' días') },
            {
              k: 'Cribado',
              v:
                values.screened === 'yes'
                  ? `Sí ${values.screenMesh}`.trim()
                  : values.screened === 'no'
                    ? 'No'
                    : '—',
            },
          ]}
        />
        <Card
          title="Condiciones"
          onEdit={edit(4)}
          items={[
            { k: 'Cielo', v: label(SKY_LABELS, values.skyCondition) },
            { k: 'Viento', v: label(WIND_LABELS, values.windCondition) },
            { k: 'Iluminación', v: label(LIGHTING_LABELS, values.lightingCondition) },
            { k: 'Humedad', v: or(values.relativeHumidityPct, ' %'), mono: true },
            { k: 'Cono', v: or(values.slumpConeCode), mono: true },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="flex items-center justify-between border-b border-row px-3.5 py-2.5">
          <span className="text-[13px] font-semibold">
            Entregas <span className="font-mono text-[#6A6E73]">({values.deliveries.length})</span>
            {' · '}Muestras <span className="font-mono text-[#6A6E73]">({samples.length})</span>
          </span>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs font-medium text-primary"
            >
              Editar
            </button>
          )}
        </div>
        {values.deliveries.length === 0 ? (
          <p className="px-3.5 py-3 text-[13px] text-subtle">Sin entregas capturadas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="bg-surface text-xs text-muted-foreground">
                <tr className="border-b">
                  {['#', 'Remisión', 'Volumen', 'Llegada', 'T. concreto', 'Rev.', 'Muestras'].map(
                    (h) => (
                      <th key={h} className="h-8 px-3.5 text-left font-medium">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {values.deliveries.map((d, i) => (
                  <tr key={i} className="border-b border-row last:border-0">
                    <td className="h-9 px-3.5 font-mono">{i + 1}</td>
                    <td className="px-3.5 font-mono">{or(d.ticketNumber)}</td>
                    <td className="px-3.5 font-mono">{or(d.volumeM3, ' m³')}</td>
                    <td className="px-3.5 font-mono">{or(d.siteArrivalTime)}</td>
                    <td className="px-3.5 font-mono">{or(d.concreteTemperatureC, ' °C')}</td>
                    <td className="px-3.5 font-mono">{or(d.slump1Cm, ' cm')}</td>
                    <td className="px-3.5">
                      {d.samples.length === 0
                        ? '—'
                        : d.samples
                            .map((s) => `${or(s.sampleNumber)} (${s.specimens.length} esp.)`)
                            .join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
