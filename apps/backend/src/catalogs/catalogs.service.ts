import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isUniqueViolation } from '../shared/prisma/prisma-errors.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';

export type CatalogKind = 'suppliers' | 'cementTypes';

export interface CatalogEntryView {
  id: string;
  name: string;
}

const LABEL: Record<CatalogKind, string> = {
  suppliers: 'Supplier',
  cementTypes: 'Cement type',
};

/**
 * Owns `concrete_suppliers` and `cement_types`: short lists users pick from and can
 * extend (Q-06). Names are unique per lab, ignoring case. Entries are renamed, never
 * deleted, because field records reference them.
 */
@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, kind: CatalogKind): Promise<CatalogEntryView[]> {
    const select = { id: true, name: true } as const;
    const orderBy = { name: 'asc' } as const;
    return kind === 'suppliers'
      ? this.prisma.concreteSupplier.findMany({ where: { tenantId }, select, orderBy })
      : this.prisma.cementType.findMany({ where: { tenantId }, select, orderBy });
  }

  async create(tenantId: string, kind: CatalogKind, name: string): Promise<CatalogEntryView> {
    await this.assertNameFree(tenantId, kind, name);
    const data = { tenantId, name };
    const select = { id: true, name: true } as const;
    try {
      return kind === 'suppliers'
        ? await this.prisma.concreteSupplier.create({ data, select })
        : await this.prisma.cementType.create({ data, select });
    } catch (error) {
      throw this.conflict(error, kind, name);
    }
  }

  async rename(
    tenantId: string,
    kind: CatalogKind,
    id: string,
    name: string,
  ): Promise<CatalogEntryView> {
    await this.assertNameFree(tenantId, kind, name, id);
    const where = { id, tenantId };
    let count: number;
    try {
      ({ count } =
        kind === 'suppliers'
          ? await this.prisma.concreteSupplier.updateMany({ where, data: { name } })
          : await this.prisma.cementType.updateMany({ where, data: { name } }));
    } catch (error) {
      throw this.conflict(error, kind, name);
    }
    if (count !== 1) throw new NotFoundException(`${LABEL[kind]} not found`);
    return { id, name };
  }

  /** For the field-records module: 404 unless the entry belongs to the tenant. */
  async assertExists(tenantId: string, kind: CatalogKind, id: string): Promise<void> {
    const where = { id, tenantId };
    const found =
      kind === 'suppliers'
        ? await this.prisma.concreteSupplier.count({ where })
        : await this.prisma.cementType.count({ where });
    if (found !== 1) throw new NotFoundException(`${LABEL[kind]} not found`);
  }

  private async assertNameFree(
    tenantId: string,
    kind: CatalogKind,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    const where = {
      tenantId,
      name: { equals: name, mode: 'insensitive' as const },
      ...(exceptId && { id: { not: exceptId } }),
    };
    const taken =
      kind === 'suppliers'
        ? await this.prisma.concreteSupplier.count({ where })
        : await this.prisma.cementType.count({ where });
    if (taken > 0) throw new ConflictException(`${LABEL[kind]} "${name}" already exists`);
  }

  private conflict(error: unknown, kind: CatalogKind, name: string): unknown {
    return isUniqueViolation(error)
      ? new ConflictException(`${LABEL[kind]} "${name}" already exists`)
      : error;
  }
}
