'use client';

import { useCurrentUser } from '@/modules/auth/hooks/useAuth';
import type { Permission } from '@/types';

/**
 * Whether the signed-in user's role may do something. The API enforces it (403); the UI
 * only hides what would fail. False while /me loads.
 */
export function usePermission(permission: Permission): boolean {
  const me = useCurrentUser();
  return me.data?.permissions.includes(permission) ?? false;
}
