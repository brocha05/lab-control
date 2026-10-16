import { env } from '@/lib/config/env';
import { cn } from '@/lib/utils/cn';

/** "LCC" tile + app name, as in the design's sidebar header. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] bg-foreground font-mono text-[11px] font-medium tracking-[0.02em] text-background">
        LCC
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-semibold">{env.APP_NAME}</div>
        <div className="truncate text-xs text-subtle">Concreto hidráulico</div>
      </div>
    </div>
  );
}
