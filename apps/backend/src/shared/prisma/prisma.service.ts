import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import type { Env } from '../config/env.validation.js';

/**
 * Prisma 7 with the `pg` driver adapter (ADR-007).
 * Tenant scoping is explicit in every query: docs/architecture/multi-tenancy.md.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL', { infer: true }) }),
      log: ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    // With the pg driver adapter, connections are opened lazily by the pool, so this does
    // not prove the database is reachable. GET /health does.
    await this.$connect();
    this.logger.log('Prisma client initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
