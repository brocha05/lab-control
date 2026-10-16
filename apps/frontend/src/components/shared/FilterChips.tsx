import { cn } from '@/lib/utils/cn';

interface FilterChipsProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}

/** Round toggle chips (one selected), as in the design's filter bars. */
export function FilterChips<T extends string>({
  value,
  options,
  onChange,
  label,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-[30px] whitespace-nowrap rounded-full border px-[11px] text-[13px] font-medium transition-colors',
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-input bg-card text-sidebar-foreground hover:bg-surface'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
