/**
 * Integration tests run against a separate database: TEST_DATABASE_URL, or DATABASE_URL
 * with `_test` appended to the database name. Tests truncate every table, so the name
 * must end in `_test` (a guard against wiping the development database).
 */
import 'dotenv/config';

export function testDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  if (explicit) return assertTestDatabase(explicit);

  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error('Set TEST_DATABASE_URL or DATABASE_URL to run the integration tests');
  }
  const url = new URL(base);
  const name = url.pathname.replace(/^\//, '');
  url.pathname = `/${name.endsWith('_test') ? name : `${name}_test`}`;
  return assertTestDatabase(url.toString());
}

export function assertTestDatabase(databaseUrl: string): string {
  const name = new URL(databaseUrl).pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to run integration tests against "${name}": name must end in _test`);
  }
  return databaseUrl;
}
