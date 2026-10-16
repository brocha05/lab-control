'use client';

import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import type { Crumb } from '@/store/uiStore';

/** Breadcrumbs for server-rendered pages. */
export function SetBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  useBreadcrumbs(crumbs);
  return null;
}
