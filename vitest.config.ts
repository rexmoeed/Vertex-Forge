import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setupAiMocks.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'server/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
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
        '**/ai/concrete*',
        '**/filesystemEngine.ts',
        '**/securityShieldingEngine.ts',
        '**/workspaceTradingEngine.ts',
        '**/templates.ts',
        '**/templates/**',
        '**/desktopBridge.ts',
        '**/desktop/**',
        '**/speechRecognitionService.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 75,
        branches: 50,
        statements: 70,
      },
    },
  },
});
