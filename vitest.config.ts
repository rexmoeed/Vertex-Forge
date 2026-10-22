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
        '**/acceptanceTests.ts',
        '**/chromeAiRuntime.ts',
        '**/security/index.ts',
        '**/projectScaffolder.ts',
        '**/visionToComponentService.ts',
        '**/localAiNodeService.ts',
        '**/opsVisibilityService.ts',
        '**/concreteAiRuntime.ts',
        '**/filesystemEngine.ts',
        '**/securityShieldingEngine.ts',
        '**/workspaceTradingEngine.ts',
        '**/templates.ts',
        '**/templates/**',
      ],
      thresholds: {
        lines: 60,
        functions: 70,
        branches: 45,
        statements: 60,
      },
    },
  },
});
