'use client';

import { useEffect } from 'react';
import { type Crumb, useUiStore } from '@/store/uiStore';

/** Sets the top bar breadcrumbs while the calling page is mounted. */
export function useBreadcrumbs(crumbs: Crumb[]) {
  const setCrumbs = useUiStore((s) => s.setCrumbs);
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    setCrumbs(JSON.parse(key) as Crumb[]);
    return () => setCrumbs([]);
  }, [key, setCrumbs]);
}
