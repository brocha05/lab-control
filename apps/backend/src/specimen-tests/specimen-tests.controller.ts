import { Controller, Get, Query } from '@nestjs/common';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { PendingTestsQueryDto } from './dto/pending-tests.dto.js';
import type { PendingTest } from './pending-tests.js';
import { SpecimenTestsService } from './specimen-tests.service.js';

/** `SpecimenTest` is exposed as `/tests` (docs/domain/entities.md). */
@Controller('tests')
export class SpecimenTestsController {
  constructor(private readonly tests: SpecimenTestsService) {}

  @Get('pending')
  pending(
    @CurrentTenant() tenantId: string,
    @Query() query: PendingTestsQueryDto,
  ): Promise<PendingTest[]> {
    return this.tests.pending(tenantId, query);
  }
}
