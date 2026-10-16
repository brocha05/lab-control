'use client';

import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiError } from '@/lib/utils/apiError';
import { formatCalendarDate } from '@/lib/utils/formatters';
import { useCatalog } from '@/modules/catalogs/hooks/useCatalogs';
import {
  useCancelFieldRecord,
  useCompleteFieldRecord,
  useFieldRecord,
  useNextNumbers,
  useSaveFieldRecord,
} from '../hooks/useFieldRecords';
import { toFormValues, toPayload, type FieldRecordValues } from '../schemas/fieldRecord.form';
import {
  describeMissing,
  LIGHTING_LABELS,
  PRODUCTION_LABELS,
  SKY_LABELS,
  STRENGTH_LABELS,
  WIND_LABELS,
} from '../schemas/fieldRecord.labels';
import type { FieldRecordDetail } from '../types/fieldRecord.types';
import { DeliveriesSection } from './DeliveriesSection';
import { FieldRecordStatusBadge } from './FieldRecordsTable';
import { NumberField, optionsOf, Section, SelectField, TextField } from './FormBits';

export function FieldRecordEditor({ id }: { id: string }) {
  const { data: record, isLoading, error } = useFieldRecord(id);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!record) {
    return (
      <p className="text-sm text-destructive">
        {getApiError(error)?.code === 'NOT_FOUND'
          ? 'El registro no existe.'
          : 'No se pudo cargar el registro.'}
      </p>
    );
  }
  // key: reset the form to the saved values after each save.
  return <EditorForm key={record.updatedAt} record={record} />;
}

function EditorForm({ record }: { record: FieldRecordDetail }) {
  const methods = useForm<FieldRecordValues>({ defaultValues: toFormValues(record) });
  const save = useSaveFieldRecord(record.id);
  const complete = useCompleteFieldRecord(record.id);
  const cancel = useCancelFieldRecord(record.id);
  const next = useNextNumbers(record.project.id);
  const suppliers = useCatalog('suppliers');
  const cements = useCatalog('cement-types');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const editable = record.status === 'DRAFT';
  const dirty = methods.formState.isDirty;
  const busy = save.isPending || complete.isPending || cancel.isPending;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit((values) => save.mutate(toPayload(values)))}
        className="space-y-6"
        noValidate
      >
        <Link
          href={`/field-records?projectId=${record.project.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Registros de {record.project.code ?? record.project.name}
        </Link>

        <PageHeader
          title={`Registro ${record.registryNumber ?? 'sin número'}`}
          description={`${record.project.name} · ${record.project.client.name} · colado ${formatCalendarDate(record.pourDate)} · ${record.sheetCount} ${record.sheetCount === 1 ? 'hoja' : 'hojas'}`}
        >
          <FieldRecordStatusBadge status={record.status} />
          {editable && (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmCancel(true)}
                disabled={busy}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar registro
              </Button>
              <Button type="submit" variant="outline" disabled={busy || !dirty}>
                {save.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar
              </Button>
              <Button
                type="button"
                onClick={() => complete.mutate()}
                disabled={busy || dirty || record.missingForCompletion.length > 0}
                title={dirty ? 'Guarda los cambios antes de completar' : undefined}
              >
                {complete.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Completar
              </Button>
            </>
          )}
        </PageHeader>

        {editable && record.missingForCompletion.length > 0 && (
          <MissingPanel missing={record.missingForCompletion} />
        )}

        <fieldset disabled={!editable || busy} className="space-y-6">
          <Section title="Encabezado">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <TextField name="registrySequence" label="Registro (MCH)" type="number" min={1} />
              <TextField name="frontNumber" label="Frente" type="number" min={1} />
              <TextField name="pourDate" label="Fecha del colado" type="date" />
              <SelectField
                name="supplierId"
                label="Proveedor"
                className="lg:col-span-2"
                options={(suppliers.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
              />
              <SelectField
                name="production"
                label="Concreto"
                options={optionsOf(PRODUCTION_LABELS)}
              />
            </div>
            {!suppliers.data?.length && (
              <p className="mt-2 text-xs text-muted-foreground">
                Agrega proveedores y tipos de cemento en{' '}
                <Link href="/settings" className="underline">
                  Configuración
                </Link>
                .
              </p>
            )}
          </Section>

          <Section title="Datos de proyecto" description="Lo especificado para el elemento.">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <SelectField
                name="strengthCriterion"
                label="f'c / MR"
                options={optionsOf(STRENGTH_LABELS)}
              />
              <NumberField name="specifiedStrengthKgCm2" label="Resistencia" unit="kg/cm²" />
              <NumberField name="specifiedSlumpCm" label="Revenimiento" unit="cm" />
              <NumberField name="specifiedSlumpToleranceCm" label="Tolerancia ±" unit="cm" />
              <NumberField name="maxAggregateSizeMm" label="TMA" unit="mm" />
              <SelectField
                name="cementTypeId"
                label="Tipo de cemento"
                options={(cements.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              />
              <NumberField name="designAgeDays" label="Edad definitiva" unit="días" step="1" />
              <SelectField
                name="screened"
                label="Cribado"
                options={[
                  { value: 'yes', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ]}
              />
              <TextField name="screenMesh" label="Malla" />
            </div>
          </Section>

          <Section title="Condiciones ambientales">
            <div className="grid gap-3 sm:grid-cols-4">
              <SelectField name="skyCondition" label="Cielo" options={optionsOf(SKY_LABELS)} />
              <SelectField name="windCondition" label="Viento" options={optionsOf(WIND_LABELS)} />
              <SelectField
                name="lightingCondition"
                label="Iluminación"
                options={optionsOf(LIGHTING_LABELS)}
              />
              <NumberField name="relativeHumidityPct" label="Humedad" unit="%" />
            </div>
          </Section>

          <Section
            title="Trazabilidad"
            description="Claves de los equipos usados (*calibrado, #verificado)."
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <TextField name="thermometerCode" label="Termómetro" placeholder="CCP-TRM-" />
              <TextField name="hygrometerCode" label="Higrómetro" placeholder="CCP-B-" />
              <TextField name="slumpConeCode" label="Cono de revenimiento" placeholder="CR-02" />
              <TextField name="tapeMeasureCode" label="Flexómetro" placeholder="FLX-01" />
              <TextField name="strikeOffBarCode" label="Enrasador" placeholder="EM-10" />
              <TextField name="slumpRodCode" label="Varilla de revenimiento" />
              <TextField name="samplingRodCode" label="Varilla de muestreo" />
              <TextField name="wheelbarrowCode" label="Carretilla" />
            </div>
          </Section>

          <DeliveriesSection
            nextSampleNumber={next.data?.sampleNumber ?? 1}
            nextSpecimenNumber={next.data?.specimenNumber ?? 1}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Masa unitaria" description="NMX-C-162. Solo si el cliente la pide.">
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField name="unitWeightScaleCode" label="Báscula" placeholder="CCP-B-" />
                <TextField name="unitWeightMoldCode" label="Molde" placeholder="CCP-MMV-" />
                <NumberField name="unitWeightMoldFactor" label="Factor molde" step="0.0001" />
                <NumberField name="unitWeightTareG" label="Tara" unit="g" />
                <NumberField name="unitWeightTareSampleG" label="Tara + muestra" unit="g" />
              </div>
            </Section>
            <Section title="Contenido de aire" description="NMX-C-157, método de presión.">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField name="airMeterCode" label="Equipo" placeholder="CCP-B-" />
                <NumberField name="airContentPct" label="Contenido de aire" unit="%" />
              </div>
            </Section>
          </div>

          <Section title="Elementos y firmas">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name="programmedElement" label="Elemento(s) programado(s)" />
              <TextField name="castElement" label="Elemento(s) colado(s)" />
              <TextField name="samplerName" label="Muestreador" />
              <TextField
                name="approvedByName"
                label="Visto bueno"
                hint="Normalmente el cliente; si no, un Signatario Técnico."
              />
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="observations" className="text-xs text-muted-foreground">
                  Observaciones
                </label>
                <textarea
                  id="observations"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  {...methods.register('observations')}
                />
              </div>
            </div>
          </Section>
        </fieldset>

        {editable && (
          <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t bg-background/95 px-6 py-3 backdrop-blur">
            <span className="mr-auto self-center text-xs text-muted-foreground">
              {dirty ? 'Hay cambios sin guardar' : 'Sin cambios'}
            </span>
            <Button type="submit" disabled={busy || !dirty}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar registro"
        description="El registro quedará cancelado y ya no se podrá editar."
        confirmLabel="Cancelar registro"
        cancelLabel="Volver"
        variant="destructive"
        onConfirm={() => cancel.mutate(undefined, { onSuccess: () => setConfirmCancel(false) })}
        isLoading={cancel.isPending}
      />
    </FormProvider>
  );
}

function MissingPanel({ missing }: { missing: string[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? missing : missing.slice(0, 6);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
      <p className="flex items-center font-medium text-amber-800 dark:text-amber-300">
        <AlertCircle className="mr-2 h-4 w-4" />
        Para completar el registro faltan {missing.length} datos (según el último guardado)
      </p>
      <ul className="mt-2 list-inside list-disc text-amber-900 dark:text-amber-200">
        {shown.map((m) => (
          <li key={m}>{describeMissing(m)}</li>
        ))}
      </ul>
      {missing.length > 6 && (
        <button type="button" className="mt-1 text-xs underline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ver menos' : `Ver los ${missing.length}`}
        </button>
      )}
    </div>
  );
}
