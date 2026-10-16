/**
 * Vitest setupFiles for `pnpm test:int`: point the app at the test database before any
 * module reads its configuration. Runtime env wins over .env in @nestjs/config.
 */
import { testDatabaseUrl } from './test-database.js';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_ACCESS_SECRET ??= 'integration-test-secret-0123456789abcdef';
process.env.PDF_RENDERER = 'stub';
process.env.REPORT_STORAGE_DRIVER = 'local';
process.env.REPORT_STORAGE_DIR = 'storage/test-reports';
