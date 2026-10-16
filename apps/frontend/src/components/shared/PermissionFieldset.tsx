'use client';

import { usePermission } from '@/lib/hooks/usePermission';
import type { Permission } from '@/types';

/** Disables every control inside when the user's role lacks the permission. */
export function PermissionFieldset({
  permission,
  children,
  className,
}: {
  permission: Permission;
  children: React.ReactNode;
  className?: string;
}) {
  const allowed = usePermission(permission);
  return (
    <fieldset disabled={!allowed} className={className}>
      {!allowed && (
        <p className="mb-3 text-[13px] text-muted-foreground">
          Solo consulta: tu puesto no modifica esta información.
        </p>
      )}
      {children}
    </fieldset>
  );
}
