import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7: CLI datasource config. Runtime uses the PrismaPg adapter in PrismaService.
// Paths are relative to this file.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
