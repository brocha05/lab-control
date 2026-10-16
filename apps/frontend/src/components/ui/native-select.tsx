import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Plain <select> styled like <Input>. Used in long data-entry forms, where it works with
 * `register()` directly and allows an empty option ('' = not filled in).
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-[38px] w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70 aria-[invalid=true]:border-destructive cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
