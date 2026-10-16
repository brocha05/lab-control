'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils/cn';

// Small building blocks for the long FPC01-01 form. All values are strings
// (fieldRecord.form.ts) and the backend validates them.

interface BaseProps {
  name: string;
  label: string;
  className?: string;
  hint?: string;
}

export function TextField({
  name,
  label,
  className,
  hint,
  ...input
}: BaseProps & Omit<React.ComponentProps<typeof Input>, 'name'>) {
  const { register } = useFormContext();
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input id={name} className="h-9" {...input} {...register(name)} />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function NumberField({
  step = '0.1',
  ...props
}: BaseProps & { step?: string; unit?: string }) {
  const { unit, label, ...rest } = props;
  return (
    <TextField
      {...rest}
      label={unit ? `${label} (${unit})` : label}
      type="number"
      step={step}
      inputMode="decimal"
    />
  );
}

export function TimeField(props: BaseProps) {
  return <TextField {...props} type="time" />;
}

export function SelectField({
  name,
  label,
  className,
  options,
  emptyLabel = '—',
}: BaseProps & { options: readonly { value: string; label: string }[]; emptyLabel?: string }) {
  const { register } = useFormContext();
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <NativeSelect id={name} className="h-9" {...register(name)}>
        <option value="">{emptyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

/** Turns a label map into select options. */
export function optionsOf<K extends string>(labels: Record<K, string>) {
  return (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}
