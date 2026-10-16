import { Controller, Get, Param, ParseUUIDPipe, Query, StreamableFile } from '@nestjs/common';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { bitacoraWorkbook } from './bitacora-workbook.js';
import { BitacoraService, type ProjectBitacora } from './bitacora.service.js';
import { BitacoraExportQueryDto, BitacoraQueryDto } from './dto/bitacora-query.dto.js';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Read-only (ADR-004). */
@Controller()
export class BitacoraController {
  constructor(private readonly bitacora: BitacoraService) {}

  @Get('projects/:projectId/bitacora')
  forProject(
    @CurrentTenant() tenantId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: BitacoraQueryDto,
  ): Promise<ProjectBitacora> {
    return this.bitacora.forProject(tenantId, projectId, query);
  }

  /** Excel workbook: one project, or every project with a tab each (Q-68). */
  @Get('bitacora/export')
  async export(
    @CurrentTenant() tenantId: string,
    @Query() query: BitacoraExportQueryDto,
  ): Promise<StreamableFile> {
    const bitacoras = query.projectId
      ? [await this.bitacora.forProject(tenantId, query.projectId)]
      : await this.bitacora.allProjects(tenantId);
    const file = await bitacoraWorkbook(bitacoras);
    const name =
      query.projectId && bitacoras[0].project.code
        ? `Bitacora-${bitacoras[0].project.code}.xlsx`
        : 'Bitacora.xlsx';
    return new StreamableFile(file, { type: XLSX, disposition: `attachment; filename="${name}"` });
  }
}
