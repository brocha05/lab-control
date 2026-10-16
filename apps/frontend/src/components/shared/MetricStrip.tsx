import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export interface Metric {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
}

/** Row of big numbers in one panel (dashboard). */
export function MetricStrip({ metrics, isLoading }: { metrics: Metric[]; isLoading?: boolean }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] overflow-hidden rounded-lg border bg-card">
      {metrics.map((m) => {
        const body = (
          <>
            <span className="text-[13px] text-muted-foreground">{m.label}</span>
            {isLoading ? (
              <Skeleton className="h-[33px] w-12" />
            ) : (
              <span className="font-mono text-[30px] font-medium leading-[1.1]">{m.value}</span>
            )}
            {m.sub && <span className="text-xs text-subtle">{m.sub}</span>}
          </>
        );
        const cls =
          'flex flex-col items-start gap-1.5 whitespace-nowrap px-[18px] py-4 text-left shadow-[inset_-1px_-1px_0_var(--border)]';
        return m.href ? (
          <Link key={m.label} href={m.href} className={`${cls} hover:bg-surface`}>
            {body}
          </Link>
        ) : (
          <div key={m.label} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
