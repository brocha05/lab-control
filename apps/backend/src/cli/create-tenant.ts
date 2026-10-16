import { hashPassword } from '../auth/domain/password.js';
import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import type { CreateTenantInput } from './create-tenant.args.js';

export class TenantAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantAlreadyExistsError';
  }
}

export interface CreatedTenant {
  tenantId: string;
  adminUserId: string;
}

/**
 * Creates a laboratory (tenant) and its first user, the Jefe de Control de Calidad
 * (QUALITY_MANAGER, who administers users: A-81), in one transaction. Fails if the
 * slug or the email already exists.
 */
export async function createTenantWithAdmin(
  prisma: PrismaClient,
  input: CreateTenantInput,
): Promise<CreatedTenant> {
  const passwordHash = await hashPassword(input.admin.password);
  try {
    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: input.tenant });
      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.admin.email,
          fullName: input.admin.fullName,
          passwordHash,
          role: 'QUALITY_MANAGER',
        },
      });
      return { tenantId: tenant.id, adminUserId: admin.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new TenantAlreadyExistsError(
        `A tenant with slug "${input.tenant.slug}" or a user with email "${input.admin.email}" already exists`,
      );
    }
    throw error;
  }
}
