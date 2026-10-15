import { defineConfig } from 'vitest/config';

// `pnpm test:int`: *.int-spec.ts against a real Postgres (src/testing/). Needs Docker
// Postgres running; the unit suite (`pnpm test`) never touches a database.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.int-spec.ts'],
    globalSetup: ['src/testing/global-setup.ts'],
    setupFiles: ['src/testing/setup-env.ts'],
    // One shared database, truncated between tests: files must not run in parallel.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
