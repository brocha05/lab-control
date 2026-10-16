import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import type { PaginatedResult } from '../shared/http/api-response.js';
import { ListQueryDto } from '../shared/http/pagination.js';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { ClientsService, type ClientView } from './clients.service.js';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto.js';
import { RequirePermission } from '../auth/permissions.guard.js';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query() query: ListQueryDto,
  ): Promise<PaginatedResult<ClientView>> {
    return this.clients.list(tenantId, query);
  }

  @RequirePermission('catalogs.manage')
  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateClientDto): Promise<ClientView> {
    return this.clients.create(tenantId, dto);
  }

  @Get(':id')
  get(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientView> {
    return this.clients.get(tenantId, id);
  }

  @RequirePermission('catalogs.manage')
  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientView> {
    return this.clients.update(tenantId, id, dto);
  }
}
