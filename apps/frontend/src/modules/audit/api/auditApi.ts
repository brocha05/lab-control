import apiClient from '@/lib/api/client';

/** `AuditEventView` in apps/backend/src/audit/audit.service.ts (ADR-010). */
export interface AuditEvent {
  id: string;
  createdAt: string;
  actor: { id: string; fullName: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  statusCode: number;
  payload: unknown;
}

export const auditApi = {
  list: (params: { entityId?: string[]; before?: string; limit?: number }) =>
    apiClient.get<AuditEvent[]>('/audit-events', {
      params,
      paramsSerializer: { indexes: null },
    }),
};
