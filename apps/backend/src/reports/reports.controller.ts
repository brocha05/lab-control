import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { CurrentTenant, CurrentUser } from '../shared/tenancy/current-tenant.decorator.js';
import { ListReportsQueryDto, ReportFieldsDto } from './dto/report.dto.js';
import { ReportsService, type RecordReports, type ReportView } from './reports.service.js';
import { RequirePermission } from '../auth/permissions.guard.js';

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('reports')
  list(
    @CurrentTenant() tenantId: string,
    @Query() query: ListReportsQueryDto,
  ): Promise<ReportView[]> {
    return this.reports.list(tenantId, query.projectId);
  }

  @Get('field-records/:id/reports')
  forRecord(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RecordReports> {
    return this.reports.forRecord(tenantId, id);
  }

  @RequirePermission('reports.prepare')
  @Post('field-records/:id/reports')
  create(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportFieldsDto,
  ): Promise<ReportView> {
    return this.reports.create(tenantId, id, dto);
  }

  @RequirePermission('reports.prepare')
  @Patch('reports/:id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportFieldsDto,
  ): Promise<ReportView> {
    return this.reports.update(tenantId, id, dto);
  }

  @RequirePermission('reports.prepare')
  @Post('reports/:id/generate')
  generate(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportView> {
    return this.reports.generate(tenantId, user.userId, id);
  }

  @RequirePermission('reports.issue')
  @Post('reports/:id/finalize')
  finalize(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportView> {
    return this.reports.finalize(tenantId, user.userId, id);
  }

  @Get('reports/:id/pdf')
  async pdf(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const { file, name } = await this.reports.pdf(tenantId, id);
    return new StreamableFile(file, {
      type: 'application/pdf',
      disposition: `inline; filename="${name}"`,
    });
  }
}
