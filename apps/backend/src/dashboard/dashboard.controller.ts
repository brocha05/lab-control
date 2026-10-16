import { Controller, Get } from '@nestjs/common';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { DashboardService, type DashboardSummary } from './dashboard.service.js';

/** Read-only, open to every role. */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@CurrentTenant() tenantId: string): Promise<DashboardSummary> {
    return this.dashboard.summary(tenantId);
  }
}
