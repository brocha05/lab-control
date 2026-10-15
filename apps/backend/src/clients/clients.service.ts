import { Injectable, NotFoundException } from '@nestjs/common';
import type { Client } from '../generated/prisma/client.js';
import type { PaginatedResult } from '../shared/http/api-response.js';
import { ListQueryDto, paginated, searchTerm, skipTake } from '../shared/http/pagination.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import type { CreateClientDto, UpdateClientDto } from './dto/client.dto.js';

export interface ClientView {
  id: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Owns `clients`. Every method takes `tenantId` first (docs/architecture/multi-tenancy.md). */
@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** `q` matches the name (case-insensitive). Sorted by name. */
  async list(tenantId: string, query: ListQueryDto): Promise<PaginatedResult<ClientView>> {
    const q = searchTerm(query.q);
    const where = {
      tenantId,
      ...(q && { name: { contains: q, mode: 'insensitive' as const } }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...skipTake(query),
      }),
      this.prisma.client.count({ where }),
    ]);
    return paginated(rows.map(toView), total, query);
  }

  async get(tenantId: string, id: string): Promise<ClientView> {
    const client = await this.prisma.client.findFirst({ where: { id, tenantId } });
    if (!client) throw new NotFoundException('Client not found');
    return toView(client);
  }

  async create(tenantId: string, dto: CreateClientDto): Promise<ClientView> {
    const client = await this.prisma.client.create({
      data: {
        tenantId,
        name: dto.name,
        contactName: dto.contactName ?? null,
        contactPhone: dto.contactPhone ?? null,
      },
    });
    return toView(client);
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto): Promise<ClientView> {
    const { count } = await this.prisma.client.updateMany({
      where: { id, tenantId },
      data: {
        name: dto.name,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
      },
    });
    if (count !== 1) throw new NotFoundException('Client not found');
    return this.get(tenantId, id);
  }

  /** For other modules: id → name of the tenant's clients among `ids` (others are absent). */
  async namesByIds(tenantId: string, ids: readonly string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.client.findMany({
      where: { tenantId, id: { in: [...new Set(ids)] } },
      select: { id: true, name: true },
    });
    return new Map(rows.map((r) => [r.id, r.name]));
  }

  /** For other modules (projects): 404 unless the client belongs to the tenant. */
  async assertExists(tenantId: string, id: string): Promise<void> {
    const found = await this.prisma.client.count({ where: { id, tenantId } });
    if (found !== 1) throw new NotFoundException('Client not found');
  }
}

function toView(c: Client): ClientView {
  return {
    id: c.id,
    name: c.name,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
