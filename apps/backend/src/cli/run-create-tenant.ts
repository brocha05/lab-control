/**
 * Entry point: `pnpm cli:create-tenant --name … --slug … …` (runs the built file).
 * See USAGE in create-tenant.args.ts.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { validateEnv } from '../shared/config/env.validation.js';
import { CliUsageError, parseCreateTenantArgs, USAGE } from './create-tenant.args.js';
import { createTenantWithAdmin, TenantAlreadyExistsError } from './create-tenant.js';

async function main(): Promise<number> {
  let input;
  try {
    // `pnpm run x -- …` forwards the separator literally.
    const argv = process.argv.slice(2).filter((arg, i) => !(i === 0 && arg === '--'));
    input = parseCreateTenantArgs(argv, process.env);
  } catch (error) {
    // Unknown flags come from node:util parseArgs as a plain TypeError.
    console.error(
      error instanceof CliUsageError
        ? error.message
        : `${String(error)}

${USAGE}`,
    );
    return 2;
  }

  const env = validateEnv(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  try {
    const created = await createTenantWithAdmin(prisma, input);
    console.log(`Tenant created: ${input.tenant.slug} (${created.tenantId})`);
    console.log(`Admin user:     ${input.admin.email} (${created.adminUserId})`);
    if (input.passwordGenerated) {
      console.log(`Password:       ${input.admin.password}   ← shown once, store it now`);
    }
    return 0;
  } catch (error) {
    if (error instanceof TenantAlreadyExistsError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

process.exitCode = await main();
