import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type User } from '../generated/prisma/client.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import type { AuthUserView } from './auth.service.js';
import { hashPassword } from './domain/password.js';
import type { CreateUserDto, UpdateUserDto } from './dto/user.dto.js';

export interface UserView extends AuthUserView {
  createdAt: Date;
}

function toView(u: User): UserView {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
  };
}

/**
 * The lab's staff accounts (Phase 10.1, A-81). Part of the auth module, which owns
 * `users`. Every method takes `tenantId` first; other labs' users are 404.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string): Promise<UserView[]> {
    const rows = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });
    return rows.map(toView);
  }

  async create(tenantId: string, dto: CreateUserDto): Promise<UserView> {
    try {
      const user = await this.prisma.user.create({
        data: {
          tenantId,
          email: dto.email.trim().toLowerCase(),
          fullName: dto.fullName.trim(),
          role: dto.role,
          passwordHash: await hashPassword(dto.password),
        },
      });
      return toView(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('That email already has an account');
      }
      throw error;
    }
  }

  /**
   * Name, role or active flag. Nobody can lower their own role or deactivate themselves,
   * so a lab always keeps an administrator. Deactivating signs the user out.
   */
  async update(
    tenantId: string,
    actorId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserView> {
    const user = await this.find(tenantId, id);
    if (id === actorId && ((dto.role && dto.role !== user.role) || dto.isActive === false)) {
      throw new ConflictException('You can not change your own role or deactivate yourself');
    }
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id, tenantId },
        data: {
          fullName: dto.fullName?.trim(),
          role: dto.role,
          isActive: dto.isActive,
        },
      });
      if (count !== 1) throw new NotFoundException('User not found');
      if (dto.isActive === false || (dto.role && dto.role !== user.role)) {
        await tx.refreshToken.updateMany({
          where: { tenantId, userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    });
    return toView(await this.find(tenantId, id));
  }

  /** New password; every session of the user ends. */
  async resetPassword(tenantId: string, id: string, password: string): Promise<void> {
    await this.find(tenantId, id);
    const passwordHash = await hashPassword(password);
    await this.prisma.$transaction([
      this.prisma.user.updateMany({ where: { id, tenantId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { tenantId, userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async find(tenantId: string, id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
