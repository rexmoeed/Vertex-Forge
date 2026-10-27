import { describe, it, expect } from 'vitest';
import {
  PackageManagerDetector,
  FrontendFrameworkDetector,
  MobileFrameworkDetector,
  BackendAndDatabaseDetector,
} from '../frameworkDetectors';
import { UniversalProjectAdapter } from '../universalProjectAdapter';
import { GlobalProjectDetector } from '../../projectDetector';

describe('Project Detection Engine & Adapters', () => {
  it('detects package manager accurately', async () => {
    const detector = new PackageManagerDetector();
    const result = await detector.detect({
      rootPath: '/app',
      files: ['pnpm-lock.yaml', 'package.json'],
      hasFile: (f) => f === 'pnpm-lock.yaml' || f === 'package.json',
      readFile: async () => null,
    });

    expect(result?.packageManager).toBe('pnpm');
  });

  it('detects frontend frameworks and languages', async () => {
    const detector = new FrontendFrameworkDetector();
    const result = await detector.detect({
      rootPath: '/app',
      files: ['src/App.tsx', 'vite.config.ts', 'tsconfig.json'],
      packageJson: {
        dependencies: { react: '^19.0.0' },
        devDependencies: { vite: '^6.0.0', typescript: '^5.0.0', vitest: '^3.0.0' },
      },
      hasFile: (f) => ['src/App.tsx', 'vite.config.ts', 'tsconfig.json'].includes(f),
      readFile: async () => null,
    });

    expect(result?.frameworks).toContain('React + Vite');
    expect(result?.languages).toContain('TypeScript');
    expect(result?.testing?.name).toBe('Vitest');
  });

  it('detects backend frameworks and databases', async () => {
    const detector = new BackendAndDatabaseDetector();
    const result = await detector.detect({
      rootPath: '/app',
      files: ['prisma/schema.prisma', 'server.ts'],
      packageJson: {
        dependencies: { express: '^4.21.0', '@prisma/client': '^6.0.0' },
      },
      hasFile: (f) => ['prisma/schema.prisma', 'server.ts'].includes(f),
      readFile: async () => null,
    });

    expect(result?.frameworks).toContain('Express');
    expect(result?.database?.name).toBe('Prisma ORM');
  });

  it('generates execution commands via UniversalProjectAdapter', () => {
    const adapter = new UniversalProjectAdapter();
    const profile: any = {
      packageManager: 'pnpm',
      scripts: { dev: 'vite', build: 'tsc && vite build', test: 'vitest' },
      frontend: { name: 'React + Vite' },
      backend: null,
    };

    const commands = adapter.getCommands(profile);
    expect(commands.dev).toBe('pnpm dev');
    expect(commands.build).toBe('pnpm build');

    const runConfig = adapter.getRunConfiguration(profile);
    expect(runConfig.defaultPort).toBe(5173);
  });

  it('runs GlobalProjectDetector engine detectProject', async () => {
    const profile = await GlobalProjectDetector.detectProject({
      rootPath: '/workspace/test',
      files: ['package.json', 'tsconfig.json', 'src/main.ts'],
      packageJson: {
        name: 'test-project',
        dependencies: { express: '^4.21.0' },
      },
      hasFile: (f) => ['package.json', 'tsconfig.json', 'src/main.ts'].includes(f),
      readFile: async () => null,
    });

    expect(profile.name).toBe('test-project');
    expect(profile.frameworks).toContain('Express');
    expect(profile.health.score).toBeGreaterThan(0);
  });
});
