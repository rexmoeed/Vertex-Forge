import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'server/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'sample-projects/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/services/**/*.ts'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/types/**',
        '**/*.d.ts',
        '**/fixtures/**',
        'src/services/acceptanceTests.ts',
        'src/services/chromeAiRuntime.ts',
        'src/services/templates.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 45,
        statements: 60,
      },
    },
  },
});
