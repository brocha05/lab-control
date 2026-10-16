import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { CatalogsService, type CatalogEntryView } from './catalogs.service.js';
import { CatalogEntryDto, CreateHolidayDto, HolidaysQueryDto } from './dto/catalog.dto.js';
import { HolidaysService, type HolidayView } from './holidays.service.js';
import { RequirePermission } from '../auth/permissions.guard.js';

@Controller('catalogs/suppliers')
export class SuppliersController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string): Promise<CatalogEntryView[]> {
    return this.catalogs.list(tenantId, 'suppliers');
  }

  @RequirePermission('catalogs.manage')
  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CatalogEntryDto,
  ): Promise<CatalogEntryView> {
    return this.catalogs.create(tenantId, 'suppliers', dto.name);
  }

  @RequirePermission('catalogs.manage')
  @Patch(':id')
  rename(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CatalogEntryDto,
  ): Promise<CatalogEntryView> {
    return this.catalogs.rename(tenantId, 'suppliers', id, dto.name);
  }
}

@Controller('catalogs/cement-types')
export class CementTypesController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string): Promise<CatalogEntryView[]> {
    return this.catalogs.list(tenantId, 'cementTypes');
  }

  @RequirePermission('catalogs.manage')
  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CatalogEntryDto,
  ): Promise<CatalogEntryView> {
    return this.catalogs.create(tenantId, 'cementTypes', dto.name);
  }

  @RequirePermission('catalogs.manage')
  @Patch(':id')
  rename(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CatalogEntryDto,
  ): Promise<CatalogEntryView> {
    return this.catalogs.rename(tenantId, 'cementTypes', id, dto.name);
  }
}

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidays: HolidaysService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query() query: HolidaysQueryDto,
  ): Promise<HolidayView[]> {
    return this.holidays.list(tenantId, query.year);
  }

  @RequirePermission('catalogs.manage')
  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateHolidayDto): Promise<HolidayView> {
    return this.holidays.create(tenantId, dto.date, dto.name);
  }

  @RequirePermission('catalogs.manage')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.holidays.remove(tenantId, id);
  }
}
