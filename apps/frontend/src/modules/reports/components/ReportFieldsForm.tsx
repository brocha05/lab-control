'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReportFields } from '../types/report.types';

const FIELDS: { key: keyof ReportFields; label: string; placeholder: string }[] = [
  { key: 'mixingEquipment', label: 'Equipo de mezclado', placeholder: 'CAMIÓN MEZCLADOR' },
  {
    key: 'compactionMethod',
    label: 'Método de compactación',
    placeholder: 'VACIADO DIRECTO (VIBRADOR DE INMERSIÓN)',
  },
  { key: 'mixDesignReference', label: 'Proporcionamiento (número y fecha)', placeholder: 'N/A' },
  { key: 'admixture', label: 'Aditivo (marca, finalidad y cantidad)', placeholder: 'N/A' },
];

/**
 * Report-only fields typed by the author (Q-64). Empty prints "N/A" on the report.
 */
export function ReportFieldsForm({
  initial,
  submitLabel,
  isPending,
  onSubmit,
  onCancel,
}: {
  initial: ReportFields;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (fields: ReportFields) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ReportFields>(initial);
  const set = (key: keyof ReportFields, v: string) => setValues((x) => ({ ...x, [key]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={f.key} className="text-[13px] font-medium">
            {f.label}
          </Label>
          <Input
            id={f.key}
            value={values[f.key] ?? ''}
            placeholder={f.placeholder}
            onChange={(e) => set(f.key, e.target.value)}
          />
        </div>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="observations" className="text-[13px] font-medium">
          Observaciones
        </Label>
        <textarea
          id="observations"
          rows={3}
          className="flex w-full resize-y rounded-md border border-input bg-card px-2.5 py-2 text-sm"
          value={values.observations ?? ''}
          onChange={(e) => set('observations', e.target.value)}
        />
      </div>
      <p className="text-xs text-subtle">Los campos vacíos se imprimen como N/A.</p>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
