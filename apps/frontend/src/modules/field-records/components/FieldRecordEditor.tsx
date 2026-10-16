'use client';

import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { FIELD_RECORD_STATUS } from '@/lib/status';
import { getApiError } from '@/lib/utils/apiError';
import { cn } from '@/lib/utils/cn';
import { addDays, formatDateLong } from '@/lib/utils/formatters';
import { useCatalog } from '@/modules/catalogs/hooks/useCatalogs';
import { useTestConfiguration } from '@/modules/projects/hooks/useProjects';
import { PlannedTestsSection } from '@/modules/specimen-tests/components/PlannedTestsSection';
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
import { STEPS, stepOfMissing, type StepNumber } from '../schemas/fieldRecord.steps';
import type { FieldRecordDetail } from '../types/fieldRecord.types';
import { DeliveriesSection } from './DeliveriesSection';
import {
  FieldGrid,
  NumberField,
  optionsOf,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from './FormBits';
import { RecordSummary } from './RecordSummary';

export function FieldRecordEditor({ id }: { id: string }) {
  const { data: record, isLoading, error } = useFieldRecord(id);
  // The catalog selects must have their options before the form mounts, or a saved
  // supplier / cement type shows as empty (a <select> can't hold a value it doesn't list).
  const suppliers = useCatalog('suppliers');
  const cements = useCatalog('cement-types');
  // Lives above the keyed form so a save (which remounts it) keeps the step.
  const [step, setStep] = useState<StepNumber>(1);

  useBreadcrumbs([
    { label: 'Proyectos', href: '/projects' },
    {
      label: record?.project.name ?? '…',
      href: record ? `/projects/${record.project.id}?tab=registros` : undefined,
    },
    { label: `Registro ${record?.registryNumber ?? ''}`.trim() },
  ]);

  if (isLoading || suppliers.isLoading || cements.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (!record) {
    return (
      <p className="text-sm text-destructive">
        {getApiError(error)?.code === 'NOT_FOUND'
          ? 'El registro no existe.'
          : 'No se pudo cargar el registro.'}
      </p>
    );
  }
  if (record.status !== 'DRAFT') return <RecordView record={record} />;
  // key: reset the form to the saved values after each save.
  return <Wizard key={record.updatedAt} record={record} step={step} setStep={setStep} />;
}

function RecordHeader({
  record,
  children,
}: {
  record: FieldRecordDetail;
  children?: React.ReactNode;
}) {
  const look = FIELD_RECORD_STATUS[record.status];
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.01em]">
            Registro{' '}
            <span className="font-mono font-medium">{record.registryNumber ?? 'sin número'}</span>
          </h1>
          <Badge
            tone={look.tone}
            className="h-6 text-[11px] font-semibold uppercase tracking-[0.06em]"
          >
            {look.label}
          </Badge>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          <Link href={`/projects/${record.project.id}`} className="font-medium text-foreground">
            {record.project.name}
          </Link>
          {' · '}
          {record.project.client.name} · colado {formatDateLong(record.pourDate)} ·{' '}
          {record.sheetCount} {record.sheetCount === 1 ? 'hoja' : 'hojas'}
        </p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/** A completed or cancelled record: read only. */
function RecordView({ record }: { record: FieldRecordDetail }) {
  return (
    <div className="flex flex-col gap-5">
      <RecordHeader record={record}>
        <Button variant="outline" asChild>
          <Link href={`/projects/${record.project.id}?tab=registros`}>Registros del proyecto</Link>
        </Button>
      </RecordHeader>
      {record.status === 'CANCELLED' && (
        <div className="rounded-lg border border-dashed border-st-draft-bd bg-surface px-3.5 py-3 text-sm text-sidebar-foreground">
          Este registro está cancelado: no se programan ni se ensayan sus especímenes.
        </div>
      )}
      <RecordSummary values={toFormValues(record)} />
      {record.status === 'COMPLETED' && <PlannedTestsSection record={record} />}
    </div>
  );
}

function Stepper({
  step,
  missingByStep,
  onGo,
}: {
  step: StepNumber;
  missingByStep: Record<number, number>;
  onGo: (n: StepNumber) => void;
}) {
  const current = STEPS[step - 1];
  return (
    <>
      <div className="hidden items-center rounded-lg border bg-card px-[18px] py-3.5 lg:flex">
        {STEPS.map((t) => {
          const cur = t.n === step;
          const done = t.n < step && !missingByStep[t.n];
          return (
            <div key={t.n} className="flex min-w-0 flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onGo(t.n)}
                className="flex min-w-0 items-center gap-2.5 whitespace-nowrap"
                aria-current={cur ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-xs font-semibold',
                    cur
                      ? 'border-primary bg-primary text-white'
                      : done
                        ? 'border-primary bg-sidebar-accent text-primary'
                        : 'border-input bg-card text-subtle'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : t.n}
                </span>
                <span
                  className={cn(
                    'truncate text-[13px]',
                    cur ? 'font-semibold text-foreground' : 'font-medium text-subtle'
                  )}
                >
                  {t.label}
                </span>
                {!!missingByStep[t.n] && (
                  <span
                    className="rounded-full bg-st-today px-1.5 font-mono text-[11px] text-st-today-fg"
                    title="Datos que faltan para completar"
                  >
                    {missingByStep[t.n]}
                  </span>
                )}
              </button>
              {t.n < STEPS.length && (
                <span
                  className={cn(
                    'mx-3 h-[1.5px] min-w-3 flex-1',
                    t.n < step ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="lg:hidden">
        <div className="flex justify-between text-[13px] font-medium">
          <span>
            Paso {step} de {STEPS.length} · {current.label}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-sm bg-border">
          <div className="h-full bg-primary" style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
      </div>
    </>
  );
}

function Wizard({
  record,
  step,
  setStep,
}: {
  record: FieldRecordDetail;
  step: StepNumber;
  setStep: (n: StepNumber) => void;
}) {
  const methods = useForm<FieldRecordValues>({ defaultValues: toFormValues(record) });
  const save = useSaveFieldRecord(record.id);
  const complete = useCompleteFieldRecord(record.id);
  const cancel = useCancelFieldRecord(record.id);
  const next = useNextNumbers(record.project.id);
  const suppliers = useCatalog('suppliers');
  const cements = useCatalog('cement-types');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const dirty = methods.formState.isDirty;
  const busy = save.isPending || complete.isPending || cancel.isPending;
  const missing = record.missingForCompletion;
  const missingByStep: Record<number, number> = {};
  for (const m of missing) {
    const n = stepOfMissing(m);
    missingByStep[n] = (missingByStep[n] ?? 0) + 1;
  }

  const submit = methods.handleSubmit((values) => save.mutate(toPayload(values)));
  const go = (n: StepNumber) => {
    setStep(n);
    document.querySelector('main')?.scrollTo({ top: 0 });
  };
  // Moving on saves what was typed, so nothing is lost between steps.
  const goNext = () => {
    const n = Math.min(STEPS.length, step + 1) as StepNumber;
    if (dirty)
      void methods.handleSubmit((v) => save.mutate(toPayload(v), { onSuccess: () => go(n) }))();
    else go(n);
  };
  const current = STEPS[step - 1];

  return (
    <FormProvider {...methods}>
      <div className="mx-auto flex max-w-[1040px] flex-col gap-5">
        <RecordHeader record={record}>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:bg-muted"
            onClick={() => setConfirmCancel(true)}
            disabled={busy}
          >
            Cancelar registro
          </Button>
        </RecordHeader>

        <Stepper step={step} missingByStep={missingByStep} onGo={go} />

        <form onSubmit={submit} noValidate className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">{current.label}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{current.description}</p>
            </div>
            {!!missingByStep[step] && step < 5 && (
              <Badge tone="today">
                {missingByStep[step] === 1 ? 'Falta 1 dato' : `Faltan ${missingByStep[step]} datos`}
              </Badge>
            )}
          </div>

          <fieldset disabled={busy} className="p-5">
            <div className={cn('flex flex-col gap-6', step !== 1 && 'hidden')}>
              <FieldGrid>
                <TextField name="registrySequence" label="Registro (MCH)" type="number" min={1} />
                <TextField name="frontNumber" label="Frente" type="number" min={1} />
                <TextField
                  name="pourDate"
                  label="Fecha del colado"
                  type="date"
                  hint="Base para calcular las fechas de ensayo"
                />
                <SelectField
                  name="supplierId"
                  label="Proveedor"
                  options={(suppliers.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
                />
                <SelectField
                  name="production"
                  label="Concreto"
                  options={optionsOf(PRODUCTION_LABELS)}
                />
              </FieldGrid>
              {!suppliers.data?.length && (
                <p className="-mt-3 text-xs text-muted-foreground">
                  Agrega proveedores y tipos de cemento en{' '}
                  <Link href="/settings" className="text-primary underline">
                    Configuración
                  </Link>
                  .
                </p>
              )}
              <FieldGrid min={280}>
                <TextField name="programmedElement" label="Elemento(s) programado(s)" />
                <TextField name="castElement" label="Elemento(s) colado(s)" />
                <TextField name="samplerName" label="Muestreador" />
              </FieldGrid>
            </div>

            <div className={cn(step !== 2 && 'hidden')}>
              <FieldGrid>
                <SelectField
                  name="strengthCriterion"
                  label="f'c / MR"
                  options={optionsOf(STRENGTH_LABELS)}
                />
                <NumberField name="specifiedStrengthKgCm2" label="Resistencia" unit="kg/cm²" />
                <NumberField name="specifiedSlumpCm" label="Revenimiento" unit="cm" />
                <NumberField name="specifiedSlumpToleranceCm" label="Tolerancia ±" unit="cm" />
                <NumberField
                  name="maxAggregateSizeMm"
                  label="Tamaño máximo del agregado"
                  unit="mm"
                />
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
              </FieldGrid>
            </div>

            <div className={cn(step !== 3 && 'hidden')}>
              <DeliveriesSection
                nextSampleNumber={next.data?.sampleNumber ?? 1}
                nextSpecimenNumber={next.data?.specimenNumber ?? 1}
              />
            </div>

            <div className={cn('flex flex-col gap-7', step !== 4 && 'hidden')}>
              <Section title="Condiciones ambientales">
                <FieldGrid>
                  <SelectField name="skyCondition" label="Cielo" options={optionsOf(SKY_LABELS)} />
                  <SelectField
                    name="windCondition"
                    label="Viento"
                    options={optionsOf(WIND_LABELS)}
                  />
                  <SelectField
                    name="lightingCondition"
                    label="Iluminación"
                    options={optionsOf(LIGHTING_LABELS)}
                  />
                  <NumberField name="relativeHumidityPct" label="Humedad relativa" unit="%" />
                </FieldGrid>
              </Section>
              <Section
                title="Trazabilidad"
                description="Claves de los equipos usados (*calibrado, #verificado)."
              >
                <FieldGrid>
                  <TextField name="thermometerCode" label="Termómetro" placeholder="CCP-TRM-" />
                  <TextField name="hygrometerCode" label="Higrómetro" placeholder="CCP-B-" />
                  <TextField
                    name="slumpConeCode"
                    label="Cono de revenimiento"
                    placeholder="CR-02"
                  />
                  <TextField name="tapeMeasureCode" label="Flexómetro" placeholder="FLX-01" />
                  <TextField name="strikeOffBarCode" label="Enrasador" placeholder="EM-10" />
                  <TextField name="slumpRodCode" label="Varilla de revenimiento" />
                  <TextField name="samplingRodCode" label="Varilla de muestreo" />
                  <TextField name="wheelbarrowCode" label="Carretilla" />
                </FieldGrid>
              </Section>
              <div className="grid gap-7 lg:grid-cols-2">
                <Section title="Masa unitaria" description="NMX-C-162. Solo si el cliente la pide.">
                  <FieldGrid min={150}>
                    <TextField name="unitWeightScaleCode" label="Báscula" placeholder="CCP-B-" />
                    <TextField name="unitWeightMoldCode" label="Molde" placeholder="CCP-MMV-" />
                    <NumberField name="unitWeightMoldFactor" label="Factor molde" step="0.0001" />
                    <NumberField name="unitWeightTareG" label="Tara" unit="g" />
                    <NumberField name="unitWeightTareSampleG" label="Tara + muestra" unit="g" />
                  </FieldGrid>
                </Section>
                <Section title="Contenido de aire" description="NMX-C-157, método de presión.">
                  <FieldGrid min={150}>
                    <TextField name="airMeterCode" label="Equipo" placeholder="CCP-B-" />
                    <NumberField name="airContentPct" label="Contenido de aire" unit="%" />
                  </FieldGrid>
                </Section>
              </div>
            </div>

            <div className={cn('flex flex-col gap-5', step !== 5 && 'hidden')}>
              {missing.length > 0 ? (
                <MissingPanel missing={missing} dirty={dirty} onGo={go} />
              ) : (
                <div className="flex items-center gap-2.5 rounded-md border border-st-done-bd bg-st-done px-3.5 py-3 text-sm text-st-done-fg">
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                  {dirty
                    ? 'Guarda los cambios para revisar si el registro está completo.'
                    : 'Están todos los datos. Al completar se programan los ensayos.'}
                </div>
              )}
              <SummaryFromForm onGo={go} />
              <PlannedAges projectId={record.project.id} />
              <FieldGrid min={280}>
                <TextField
                  name="approvedByName"
                  label="Visto bueno"
                  hint="Normalmente el cliente; si no, un Signatario Técnico."
                />
              </FieldGrid>
              <TextAreaField name="observations" label="Observaciones" />
            </div>
          </fieldset>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-b-lg border-t bg-surface px-5 py-3.5">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => go((step - 1) as StepNumber)}
                disabled={busy}
              >
                ← Anterior
              </Button>
            )}
            <span className="hidden flex-1 text-xs text-subtle sm:block">
              {dirty ? 'Hay cambios sin guardar' : 'Todo guardado'}
            </span>
            <Button type="submit" variant="outline" size="lg" disabled={busy || !dirty}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Guardar borrador
            </Button>
            {step < STEPS.length ? (
              <Button type="button" size="lg" onClick={goNext} disabled={busy}>
                Siguiente →
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="border-st-done-fg bg-st-done-fg hover:bg-[#174F2D]"
                onClick={() => complete.mutate()}
                disabled={busy || dirty || missing.length > 0}
                title={dirty ? 'Guarda los cambios antes de completar' : undefined}
              >
                {complete.isPending && <Loader2 className="animate-spin" />}
                Completar registro
              </Button>
            )}
          </div>
        </form>
      </div>

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

function SummaryFromForm({ onGo }: { onGo: (n: StepNumber) => void }) {
  const values = useWatch<FieldRecordValues>() as FieldRecordValues;
  return <RecordSummary values={values} onEditStep={(n) => onGo(n as StepNumber)} />;
}

/** The project's default ages, which the record's specimens get on completion (6.4). */
function PlannedAges({ projectId }: { projectId: string }) {
  const { data } = useTestConfiguration(projectId);
  const pourDate = useWatch<FieldRecordValues, 'pourDate'>({ name: 'pourDate' });
  return (
    <div className="rounded-md border border-st-progress-bd bg-[#F7FAFD]">
      <div className="border-b border-[#DCE6F3] px-3.5 py-2.5 text-[13px] font-semibold text-accent-foreground">
        Ensayos que se programarán
      </div>
      <div className="px-3.5 py-2.5 text-[13px]">
        {!data?.length ? (
          <span className="text-muted-foreground">
            El proyecto no tiene edades de ensayo.{' '}
            <Link href={`/projects/${projectId}?tab=config`} className="text-primary underline">
              Configúralas
            </Link>{' '}
            antes de completar.
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-1.5 font-mono">
              {data.map((a) => (
                <div key={a.ageDays} className="flex justify-between gap-3">
                  <span className="font-semibold">{a.ageDays} días</span>
                  <span className="text-muted-foreground">× {a.specimenCount} por muestra</span>
                  <span>{pourDate ? formatDateLong(addDays(pourDate, a.ageDays)) : '—'}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-[#6A6E73]">
              Los especímenes de menor número van a la primera edad. Si la fecha cae en domingo o
              festivo se recorre al día hábil siguiente.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MissingPanel({
  missing,
  dirty,
  onGo,
}: {
  missing: string[];
  dirty: boolean;
  onGo: (n: StepNumber) => void;
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? missing : missing.slice(0, 8);
  return (
    <div className="rounded-md border border-st-today-bd bg-st-today px-3.5 py-3 text-sm text-st-today-fg">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        Para completar el registro{' '}
        {missing.length === 1 ? 'falta 1 dato' : `faltan ${missing.length} datos`}
        {dirty ? ' (según el último guardado)' : ''}
      </p>
      <ul className="mt-2 flex flex-col gap-0.5">
        {shown.map((m) => (
          <li key={m}>
            <button
              type="button"
              className="text-left hover:underline"
              onClick={() => onGo(stepOfMissing(m))}
            >
              Paso {stepOfMissing(m)} · {describeMissing(m)}
            </button>
          </li>
        ))}
      </ul>
      {missing.length > 8 && (
        <button type="button" className="mt-1 text-xs underline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ver menos' : `Ver los ${missing.length}`}
        </button>
      )}
    </div>
  );
}
