import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put, Query } from '@nestjs/common';
import type { ProjectView } from '../projects/projects.service.js';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { CurrentTenant, CurrentUser } from '../shared/tenancy/current-tenant.decorator.js';
import { PendingTestsQueryDto } from './dto/pending-tests.dto.js';
import { RescheduleTestDto } from './dto/reschedule-test.dto.js';
import { SaveTestResultsDto, WorksheetQueryDto } from './dto/worksheet.dto.js';
import type { PendingTest } from './pending-tests.js';
import { SpecimenTestsService, type SpecimenTestBrief } from './specimen-tests.service.js';
import type { Worksheet } from './worksheet.js';

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

  /** FPC06-01: one project and test date, results derived on read (ADR-008). */
  @Get('worksheet')
  worksheet(
    @CurrentTenant() tenantId: string,
    @Query() query: WorksheetQueryDto,
  ): Promise<Worksheet & { project: ProjectView }> {
    return this.tests.worksheet(tenantId, query);
  }

  /** Saves a sheet's press readings; each row completes (or corrects) its test. */
  @Put('results')
  saveResults(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveTestResultsDto,
  ): Promise<{ saved: number }> {
    return this.tests.saveResults(tenantId, user.userId, dto);
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
