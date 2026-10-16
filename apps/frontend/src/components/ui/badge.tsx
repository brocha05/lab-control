import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Status chip of the design: square-ish, tinted, with a dot. `tone` picks the colour;
 * the label always says the state in words (colour is never the only cue).
 */
const badgeVariants = cva(
  'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 text-xs font-medium',
  {
    variants: {
      tone: {
        pending: 'border-st-pending-bd bg-st-pending text-st-pending-fg',
        today: 'border-st-today-bd bg-st-today text-st-today-fg',
        late: 'border-st-late-bd bg-st-late text-st-late-fg',
        done: 'border-st-done-bd bg-st-done text-st-done-fg',
        draft: 'border-dashed border-st-draft-bd bg-st-draft text-st-draft-fg',
        off: 'border-st-off-bd bg-st-off text-st-off-fg',
        progress: 'border-st-progress-bd bg-st-progress text-st-progress-fg',
        outline: 'border-border bg-card text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'pending' },
  }
);

const dotTone: Record<NonNullable<BadgeProps['tone']>, string> = {
  pending: 'bg-st-pending-dot',
  today: 'bg-st-today-dot',
  late: 'bg-st-late-dot',
  done: 'bg-st-done-dot',
  draft: 'bg-st-draft-dot',
  off: 'bg-st-off-dot',
  progress: 'bg-st-progress-dot',
  outline: 'hidden',
};

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Hide the leading dot. */
  plain?: boolean;
}

function Badge({ className, tone, plain, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {!plain && <span className={cn('h-1.5 w-1.5 rounded-full', dotTone[tone ?? 'pending'])} />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
