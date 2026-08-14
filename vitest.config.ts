import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    exclude: [
      '.astro/**',
      '.sst/**',
      'journal/**',
      'tests/browser/**',
      'node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/client/**/*.ts',
        'src/config/**/*.ts',
        'src/domain/**/*.ts',
        'src/services/**/*.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
