'use client';

import { usePermission } from '@/lib/hooks/usePermission';
import type { Permission } from '@/types';

/** Renders its children only when the user's role has the permission. */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return usePermission(permission) ? <>{children}</> : <>{fallback}</>;
}
