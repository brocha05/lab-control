import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import type { AuditDraft } from './audit-event.js';

export interface AuditEventView {
  id: string;
  createdAt: Date;
  actor: { id: string; fullName: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  statusCode: number;
  payload: unknown;
}

const PAGE = 50;

/** Owns `audit_events` (ADR-010): append only. Every method takes `tenantId` first. */
@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async record(
    tenantId: string,
    actorUserId: string | null,
    draft: AuditDraft,
    meta: { statusCode: number; requestId: string | null },
  ): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorUserId,
        action: draft.action,
        entityType: draft.entityType,
        entityId: draft.entityId,
        payload: draft.payload ?? undefined,
        statusCode: meta.statusCode,
        requestId: meta.requestId,
      },
    });
  }

  /** Newest first; `entityIds` narrows to some entities (e.g. a record and its reports). */
  async list(
    tenantId: string,
    query: { entityIds?: string[]; before?: Date; limit?: number },
  ): Promise<AuditEventView[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        tenantId,
        ...(query.entityIds?.length && { entityId: { in: query.entityIds } }),
        ...(query.before && { createdAt: { lt: query.before } }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(query.limit ?? PAGE, 200),
    });
    const names = await this.auth.userNames(tenantId, [
      ...new Set(rows.map((r) => r.actorUserId).filter((id): id is string => !!id)),
    ]);
    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      actor: r.actorUserId
        ? { id: r.actorUserId, fullName: names.get(r.actorUserId) ?? '—' }
        : null,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      statusCode: r.statusCode,
      payload: r.payload,
    }));
  }
}
