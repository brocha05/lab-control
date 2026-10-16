import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Buttons under the text. */
  actions?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-1.5 grid h-11 w-11 place-items-center rounded-lg border border-dashed border-[#C9CBCE]">
          <Icon className="h-5 w-5 text-subtle" strokeWidth={1.6} />
        </div>
      )}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actions && <div className="mt-2.5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
