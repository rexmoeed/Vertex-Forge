import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'server/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'sample-projects/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/services/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/**', '**/*.d.ts', '**/fixtures/**'],
      thresholds: {
        lines: 40,
        functions: 50,
        branches: 30,
        statements: 40,
      },
    },
  },
});
