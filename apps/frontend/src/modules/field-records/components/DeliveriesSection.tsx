'use client';

import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCatalog } from '@/modules/catalogs/hooks/useCatalogs';
import {
  cumulativeVolumes,
  emptyDelivery,
  emptySample,
  emptySpecimen,
  type FieldRecordValues,
} from '../schemas/fieldRecord.form';
import { SPECIMEN_TYPE_LABELS } from '../schemas/fieldRecord.labels';
import { NumberField, optionsOf, Section, SelectField, TextField, TimeField } from './FormBits';

const DELIVERIES_PER_SHEET = 7;

/** Highest number already typed in the form, so new rows continue from it. */
function highest(values: readonly string[]): number {
  return values.reduce((max, v) => Math.max(max, Number(v) || 0), 0);
}

interface DeliveriesSectionProps {
  /** Next free numbers in the project, from the server (Q-57, Q-58). */
  nextSampleNumber: number;
  nextSpecimenNumber: number;
}

/**
 * The FPC01-01 table: one row per truck. The truck's "remisión" values and the samples
 * taken from it (with their specimens) open under the row.
 */
export function DeliveriesSection({
  nextSampleNumber,
  nextSpecimenNumber,
}: DeliveriesSectionProps) {
  const { control } = useFormContext<FieldRecordValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'deliveries' });
  const deliveries = useWatch({ control, name: 'deliveries' }) ?? [];
  const cumulative = cumulativeVolumes(deliveries);

  return (
    <Section
      title="Entregas"
      description="Un renglón por camión, en el orden de la hoja. Hasta 7 por hoja; el registro puede tener varias hojas."
    >
      <div className="space-y-3">
        {fields.map((field, i) => (
          <DeliveryRow
            key={field.id}
            index={i}
            cumulative={cumulative[i]}
            onRemove={() => remove(i)}
            nextSampleNumber={nextSampleNumber}
            nextSpecimenNumber={nextSpecimenNumber}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => append(emptyDelivery())}
      >
        <Plus />
        Agregar entrega
      </Button>
    </Section>
  );
}

function DeliveryRow({
  index,
  cumulative,
  onRemove,
  nextSampleNumber,
  nextSpecimenNumber,
}: {
  index: number;
  cumulative: number | null;
  onRemove: () => void;
  nextSampleNumber: number;
  nextSpecimenNumber: number;
}) {
  const cements = useCatalog('cement-types');
  const [showTicket, setShowTicket] = useState(false);
  const p = `deliveries.${index}` as const;
  const sheet = Math.floor(index / DELIVERIES_PER_SHEET) + 1;

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b bg-surface px-3 py-2">
        <p className="text-sm font-semibold">
          Entrega {index + 1}
          <span className="ml-2 font-mono text-xs font-normal text-subtle">Hoja {sheet}</span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-subtle hover:bg-muted"
          onClick={onRemove}
          aria-label={`Quitar entrega ${index + 1}`}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-4 lg:grid-cols-6">
        <TextField name={`${p}.ticketNumber`} label="Remisión / placas" className="lg:col-span-2" />
        <NumberField name={`${p}.volumeM3`} label="Volumen" unit="m³" step="0.01" />
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-strong">Acumulado</p>
          <p className="flex h-[38px] items-center font-mono text-sm">
            {cumulative ?? '—'} <span className="ml-1 text-[13px] text-subtle">m³</span>
          </p>
        </div>
        <TimeField name={`${p}.plantDepartureTime`} label="Salida planta / hechura" />
        <TimeField name={`${p}.siteArrivalTime`} label="Llegada obra / disponible" />
        <TimeField name={`${p}.pourStartTime`} label="Colado: inicio" />
        <TimeField name={`${p}.pourEndTime`} label="Colado: término" />
        <NumberField name={`${p}.ambientTemperatureC`} label="T. ambiente" unit="°C" />
        <NumberField name={`${p}.concreteTemperatureC`} label="T. concreto" unit="°C" />
        <NumberField name={`${p}.slump1Cm`} label="Revenimiento 1" unit="cm" />
        <NumberField
          name={`${p}.slump2Cm`}
          label="Revenimiento 2"
          unit="cm"
          hint="Solo si se repitió la prueba"
        />
      </div>

      <div className="border-t px-3 py-2">
        <button
          type="button"
          className="flex items-center text-[13px] font-medium text-primary"
          onClick={() => setShowTicket((v) => !v)}
        >
          {showTicket ? (
            <ChevronDown className="mr-1 h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="mr-1 h-3.5 w-3.5" />
          )}
          Datos de la remisión de este camión
        </button>
        {showTicket && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <NumberField name={`${p}.ticketStrengthKgCm2`} label="f'c / MR" unit="kg/cm²" />
            <NumberField name={`${p}.ticketSlumpCm`} label="Revenimiento" unit="cm" />
            <NumberField name={`${p}.ticketSlumpToleranceCm`} label="Tolerancia ±" unit="cm" />
            <NumberField name={`${p}.ticketMaxAggregateMm`} label="TMA" unit="mm" />
            <SelectField
              name={`${p}.ticketCementTypeId`}
              label="Tipo de cemento"
              options={(cements.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
            <NumberField
              name={`${p}.ticketDesignAgeDays`}
              label="Edad definitiva"
              unit="días"
              step="1"
            />
          </div>
        )}
      </div>

      <SamplesEditor
        deliveryIndex={index}
        nextSampleNumber={nextSampleNumber}
        nextSpecimenNumber={nextSpecimenNumber}
      />
    </div>
  );
}

function SamplesEditor({
  deliveryIndex,
  nextSampleNumber,
  nextSpecimenNumber,
}: {
  deliveryIndex: number;
  nextSampleNumber: number;
  nextSpecimenNumber: number;
}) {
  const { control, getValues } = useFormContext<FieldRecordValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `deliveries.${deliveryIndex}.samples`,
  });

  const addSample = () => {
    const all = getValues('deliveries').flatMap((d) => d.samples);
    const sampleNumber = Math.max(nextSampleNumber, highest(all.map((s) => s.sampleNumber)) + 1);
    const firstSpecimen = Math.max(
      nextSpecimenNumber,
      highest(all.flatMap((s) => s.specimens.map((sp) => sp.specimenNumber))) + 1
    );
    // Usually 4 specimens per sample, 2 per age (Q-14).
    append({
      ...emptySample(),
      sampleNumber: String(sampleNumber),
      specimens: [0, 1, 2, 3].map((k) => emptySpecimen(String(firstSpecimen + k))),
    });
  };

  return (
    <div className="border-t bg-sunken px-3 py-3">
      {fields.map((field, j) => (
        <SampleEditor
          key={field.id}
          deliveryIndex={deliveryIndex}
          sampleIndex={j}
          onRemove={() => remove(j)}
        />
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addSample}>
        <Plus />
        Muestra de este camión
      </Button>
    </div>
  );
}

function SampleEditor({
  deliveryIndex,
  sampleIndex,
  onRemove,
}: {
  deliveryIndex: number;
  sampleIndex: number;
  onRemove: () => void;
}) {
  const { control, register, getValues } = useFormContext<FieldRecordValues>();
  const p = `deliveries.${deliveryIndex}.samples.${sampleIndex}` as const;
  const { fields, append, remove } = useFieldArray({ control, name: `${p}.specimens` });

  const addSpecimen = () => {
    const numbers = getValues(`${p}.specimens`).map((sp) => sp.specimenNumber);
    const last = highest(numbers);
    append(emptySpecimen(last ? String(last + 1) : ''));
  };

  return (
    <div className="mb-3 rounded-md border bg-card p-3">
      <div className="mb-3 flex items-end gap-3">
        <TextField name={`${p}.sampleNumber`} label="No. muestra" type="number" className="w-28" />
        <SelectField
          name={`${p}.specimenType`}
          label="Tipo"
          className="w-40"
          options={optionsOf(SPECIMEN_TYPE_LABELS)}
        />
        <TimeField name={`${p}.moldedAt`} label="Hora de elaboración" className="w-36" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto h-9 w-9 text-subtle hover:bg-muted"
          onClick={onRemove}
          aria-label="Quitar muestra"
        >
          <Trash2 />
        </Button>
      </div>

      <p className="mb-1.5 text-[13px] font-medium text-strong">
        Especímenes (clave de espécimen · clave de molde, en el orden de la hoja)
      </p>
      <div className="flex flex-wrap gap-2">
        {fields.map((field, k) => (
          <div key={field.id} className="flex items-center gap-1 rounded-md border px-1.5 py-1">
            <Input
              type="number"
              className="h-8 w-20 font-mono"
              placeholder="405"
              aria-label={`Espécimen ${k + 1}`}
              {...register(`${p}.specimens.${k}.specimenNumber`)}
            />
            <Input
              className="h-8 w-16 font-mono"
              placeholder="020"
              aria-label={`Molde del espécimen ${k + 1}`}
              {...register(`${p}.specimens.${k}.moldCode`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-subtle hover:bg-muted"
              onClick={() => remove(k)}
              aria-label={`Quitar espécimen ${k + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="h-10" onClick={addSpecimen}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}
