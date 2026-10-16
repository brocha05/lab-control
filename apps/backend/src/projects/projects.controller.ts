import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { PaginatedResult } from '../shared/http/api-response.js';
import { CurrentTenant } from '../shared/tenancy/current-tenant.decorator.js';
import { CreateProjectDto, ListProjectsQueryDto, UpdateProjectDto } from './dto/project.dto.js';
import { TestConfigurationDto } from './dto/test-configuration.dto.js';
import { ProjectsService, type ProjectView, type TestAge } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query() query: ListProjectsQueryDto,
  ): Promise<PaginatedResult<ProjectView>> {
    return this.projects.list(tenantId, query);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateProjectDto): Promise<ProjectView> {
    return this.projects.create(tenantId, dto);
  }

  @Get(':id')
  get(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectView> {
    return this.projects.get(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectView> {
    return this.projects.update(tenantId, id, dto);
  }

  @Get(':id/test-configuration')
  testConfiguration(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TestAge[]> {
    return this.projects.testConfiguration(tenantId, id);
  }

  @Put(':id/test-configuration')
  replaceTestConfiguration(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TestConfigurationDto,
  ): Promise<TestAge[]> {
    return this.projects.replaceTestConfiguration(tenantId, id, dto.ages);
  }
}
