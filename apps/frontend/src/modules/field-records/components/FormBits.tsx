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

const labelClass = 'text-[13px] font-medium text-[#33363A]';

export function TextField({
  name,
  label,
  className,
  hint,
  unit,
  ...input
}: BaseProps & { unit?: string } & Omit<React.ComponentProps<typeof Input>, 'name'>) {
  const { register } = useFormContext();
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name} className={labelClass}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={name}
          className={cn(unit && 'pr-14', input.type === 'number' && 'font-mono')}
          {...input}
          {...register(name)}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-subtle">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-[#6A6E73]">{hint}</p>}
    </div>
  );
}

export function NumberField({
  step = '0.1',
  ...props
}: BaseProps & { step?: string; unit?: string }) {
  return <TextField {...props} type="number" step={step} inputMode="decimal" />;
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
      <Label htmlFor={name} className={labelClass}>
        {label}
      </Label>
      <NativeSelect id={name} {...register(name)}>
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

export function TextAreaField({
  name,
  label,
  className,
  hint,
  rows = 3,
}: BaseProps & { rows?: number }) {
  const { register } = useFormContext();
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name} className={labelClass}>
        {label}
      </Label>
      <textarea
        id={name}
        rows={rows}
        className="flex w-full resize-y rounded-md border border-input bg-card px-2.5 py-2 text-sm disabled:bg-surface disabled:opacity-70"
        {...register(name)}
      />
      {hint && <p className="text-xs text-[#6A6E73]">{hint}</p>}
    </div>
  );
}

/** Turns a label map into select options. */
export function optionsOf<K extends string>(labels: Record<K, string>) {
  return (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
}

/** A titled block inside a step. */
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
    <section className="space-y-3">
      <header>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}

/** Responsive field grid used by every step. */
export function FieldGrid({ children, min = 200 }: { children: React.ReactNode; min?: number }) {
  return (
    <div
      className="grid gap-x-5 gap-y-4"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))` }}
    >
      {children}
    </div>
  );
}
