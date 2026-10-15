import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import { AppModule } from '../app.module.js';
import { configureApp } from '../app.setup.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';

export interface TestApp {
  app: INestApplication;
  /** Pass to supertest: `request(t.http).get('/api/v1/me')`. */
  http: Server;
  prisma: PrismaService;
}

/** The real AppModule with the production HTTP pipeline, against the test database. */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return { app, http: app.getHttpServer() as Server, prisma: app.get(PrismaService) };
}

/** Empties every table except Prisma's migration history. Call in `beforeEach`. */
export async function truncateAll(prisma: PrismaService): Promise<void> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"public"."${r.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
