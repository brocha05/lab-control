import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { PendingTestsQueryDto } from './dto/pending-tests.dto.js';
import { RescheduleTestDto } from './dto/reschedule-test.dto.js';
import type { PendingTest } from './pending-tests.js';
import { SpecimenTestsService, type SpecimenTestBrief } from './specimen-tests.service.js';

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

  @Patch(':id/schedule')
  reschedule(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleTestDto,
  ): Promise<SpecimenTestBrief> {
    return this.tests.reschedule(tenantId, id, dto);
  }
}
