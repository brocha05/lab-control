import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../auth/permissions.guard.js';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { AuditService, type AuditEventView } from './audit.service.js';
import { AuditQueryDto } from './dto/audit-query.dto.js';

/** Read-only audit trail (ADR-010, Q-54). */
@Controller('audit-events')
@RequirePermission('audit.read')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query() query: AuditQueryDto,
  ): Promise<AuditEventView[]> {
    return this.audit.list(tenantId, {
      entityIds: query.entityId,
      before: query.before ? new Date(query.before) : undefined,
      limit: query.limit,
    });
  }
}
