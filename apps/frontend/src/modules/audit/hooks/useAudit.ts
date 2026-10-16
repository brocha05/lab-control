'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { auditApi } from '../api/auditApi';

const PAGE = 30;

/** The audit trail, newest first, in pages of 30 (optionally for some entities). */
export function useAuditEvents(entityIds: string[] | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['audit', entityIds ?? 'all'],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      (await auditApi.list({ entityId: entityIds, before: pageParam, limit: PAGE })).data,
    getNextPageParam: (last) =>
      last.length === PAGE ? last[last.length - 1].createdAt : undefined,
  });
}
