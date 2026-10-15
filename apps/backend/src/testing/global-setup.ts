/**
 * Vitest globalSetup for `pnpm test:int`: creates the test database if needed and applies
 * every migration with `prisma migrate deploy` (the same command production uses).
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import pg from 'pg';
import { testDatabaseUrl } from './test-database.js';

export default async function setup(): Promise<void> {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.slice(1);

  const admin = new URL(url);
  admin.pathname = '/postgres';
  admin.search = '';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (rowCount === 0) {
      // Identifier can't be a bind parameter; the name was validated to end in _test.
      await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }

  const prismaCli = join(import.meta.dirname, '../../node_modules/prisma/build/index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: join(import.meta.dirname, '../..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}
