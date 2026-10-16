import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { PaginatedResult } from '../shared/http/api-response.js';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { CurrentTenant, CurrentUser } from '../shared/tenancy/current-tenant.decorator.js';
import {
  CreateFieldRecordDto,
  FieldRecordFormDto,
  ListFieldRecordsQueryDto,
} from './dto/field-record.dto.js';
import { FieldRecordsService, type NextNumbers } from './field-records.service.js';
import type { FieldRecordDetail, FieldRecordSummary } from './field-records.views.js';

/** Creation and listing are nested under the project; item access is flat. */
@Controller()
export class FieldRecordsController {
  constructor(private readonly fieldRecords: FieldRecordsService) {}

  @Get('projects/:projectId/field-records')
  list(
    @CurrentTenant() tenantId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ListFieldRecordsQueryDto,
  ): Promise<PaginatedResult<FieldRecordSummary>> {
    return this.fieldRecords.list(tenantId, projectId, query);
  }

  @Get('projects/:projectId/field-records/next-numbers')
  nextNumbers(
    @CurrentTenant() tenantId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<NextNumbers> {
    return this.fieldRecords.nextNumbers(tenantId, projectId);
  }

  @Post('projects/:projectId/field-records')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateFieldRecordDto,
  ): Promise<FieldRecordDetail> {
    return this.fieldRecords.create(user.tenantId, projectId, dto, user.userId);
  }

  @Get('field-records/:id')
  get(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FieldRecordDetail> {
    return this.fieldRecords.get(tenantId, id);
  }

  @Put('field-records/:id')
  replaceForm(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FieldRecordFormDto,
  ): Promise<FieldRecordDetail> {
    return this.fieldRecords.replaceForm(tenantId, id, dto);
  }

  @Post('field-records/:id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FieldRecordDetail> {
    return this.fieldRecords.complete(tenantId, id);
  }

  @Post('field-records/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FieldRecordDetail> {
    return this.fieldRecords.cancel(tenantId, id);
  }

  /** Damaged specimen: cancels it and its open tests (5.4). */
  @Post('specimens/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelSpecimen(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FieldRecordDetail> {
    return this.fieldRecords.cancelSpecimen(tenantId, id);
  }
}
