import { defineConfig } from 'vitest/config';

// Based on the NestJS 12 ESM project template.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/cli/run-*.ts',
        'src/testing/**',
        'src/**/*.int-spec.ts',
        'src/generated/**',
        'src/**/*.spec.ts',
      ],
    },
  },
});
