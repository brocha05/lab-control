import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service.js';
import type { Prisma, Project } from '../generated/prisma/client.js';
import type { PaginatedResult } from '../shared/http/api-response.js';
import { paginated, searchTerm, skipTake } from '../shared/http/pagination.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import type {
  CreateProjectDto,
  ListProjectsQueryDto,
  UpdateProjectDto,
} from './dto/project.dto.js';

export interface ProjectView {
  id: string;
  name: string;
  location: string | null;
  client: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Owns `projects` (and `project_test_configurations`, Phase 6). Every method takes
 * `tenantId` first. Client names come from ClientsService, never from its table.
 */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  /** `q` matches name or location (case-insensitive). Sorted by name. */
  async list(tenantId: string, query: ListProjectsQueryDto): Promise<PaginatedResult<ProjectView>> {
    const q = searchTerm(query.q);
    const where: Prisma.ProjectWhereInput = {
      tenantId,
      ...(query.clientId && { clientId: query.clientId }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...skipTake(query),
      }),
      this.prisma.project.count({ where }),
    ]);
    return paginated(await this.toViews(tenantId, rows), total, query);
  }

  async get(tenantId: string, id: string): Promise<ProjectView> {
    const project = await this.prisma.project.findFirst({ where: { id, tenantId } });
    if (!project) throw new NotFoundException('Project not found');
    const [view] = await this.toViews(tenantId, [project]);
    return view;
  }

  async create(tenantId: string, dto: CreateProjectDto): Promise<ProjectView> {
    // 404 for another tenant's client. The composite FK (client_id, tenant_id) would
    // reject it anyway; this check gives the right status code.
    await this.clients.assertExists(tenantId, dto.clientId);
    const project = await this.prisma.project.create({
      data: { tenantId, clientId: dto.clientId, name: dto.name, location: dto.location ?? null },
    });
    return this.get(tenantId, project.id);
  }

  async update(tenantId: string, id: string, dto: UpdateProjectDto): Promise<ProjectView> {
    if (dto.clientId !== undefined) {
      await this.clients.assertExists(tenantId, dto.clientId);
    }
    const { count } = await this.prisma.project.updateMany({
      where: { id, tenantId },
      data: { clientId: dto.clientId, name: dto.name, location: dto.location },
    });
    if (count !== 1) throw new NotFoundException('Project not found');
    return this.get(tenantId, id);
  }

  private async toViews(tenantId: string, rows: Project[]): Promise<ProjectView[]> {
    const names = await this.clients.namesByIds(
      tenantId,
      rows.map((r) => r.clientId),
    );
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      // The composite FK guarantees the client exists in the same tenant.
      client: { id: p.clientId, name: names.get(p.clientId) ?? '' },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }
}
