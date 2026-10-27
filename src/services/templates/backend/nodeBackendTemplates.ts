import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../../types/scaffolding';

// 1. Express
export const backendExpress: TemplateDefinition = {
  id: 'backend-express',
  name: 'Node.js + Express',
  category: 'backend',
  description: 'Robust Express REST API with TypeScript, Zod schema validation, CORS, error middleware, and Vitest assertions.',
  icon: '🟢',
  badge: 'Popular',
  languages: ['TypeScript', 'JavaScript'],
  frameworks: ['Express', 'Node.js', 'Zod'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean', 'simple'],
  defaultPorts: { dev: 4000 },
  commands: { dev: 'npm run dev', build: 'npm run build', test: 'npm test' },
  envVariables: [
    { key: 'PORT', description: 'Port', defaultValue: '4000' },
  ],
  compatibleLibraries: [
    { id: 'cors', name: 'CORS', category: 'routing', description: 'Cross-origin middleware', defaultSelected: true, packageNames: ['cors'] },
    { id: 'zod', name: 'Zod', category: 'validation', description: 'Schema validator', defaultSelected: true, packageNames: ['zod'] },
  ],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Dependencies',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '1.0.0',
        type: 'module',
        scripts: { dev: 'tsx watch src/server.ts', build: 'tsc', test: 'vitest run' },
        dependencies: { express: '^4.21.2', cors: '^2.8.5', zod: '^3.24.1' },
        devDependencies: { '@types/express': '^4.17.21', tsx: '^4.19.2', typescript: '^5.7.0', vitest: '^3.0.0' },
      }, null, 2),
    },
    {
      id: 'server-ts',
      path: 'src/server.ts',
      description: 'Express server entry',
      category: 'source',
      content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: '${ctx.projectName}' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(\`[Server] Running on http://localhost:\${PORT}\`);
  });
}

export default app;
`,
    },
  ],
};

// 2. Fastify
export const backendFastify: TemplateDefinition = {
  id: 'backend-fastify',
  name: 'Fastify',
  category: 'backend',
  description: 'Extremely fast and low overhead web framework for Node.js.',
  icon: '⚡',
  languages: ['TypeScript', 'JavaScript'],
  frameworks: ['Fastify', 'Node.js'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'simple',
  supportedArchitectures: ['simple', 'modular'],
  defaultPorts: { dev: 4000 },
  commands: { dev: 'npm run dev', build: 'npm run build', test: 'npm test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Fastify manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        type: 'module',
        scripts: { dev: 'tsx watch src/index.ts', build: 'tsc', test: 'vitest run' },
        dependencies: { fastify: '^5.2.0' },
        devDependencies: { tsx: '^4.19.2', typescript: '^5.7.0', vitest: '^3.0.0' },
      }, null, 2),
    },
    {
      id: 'fastify-index',
      path: 'src/index.ts',
      description: 'Fastify entry point',
      category: 'source',
      content: `import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/health', async () => {
  return { status: 'healthy', framework: 'Fastify', service: '${ctx.projectName}' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
`,
    },
  ],
};

// 3. NestJS
export const backendNestjs: TemplateDefinition = {
  id: 'backend-nestjs',
  name: 'NestJS',
  category: 'backend',
  description: 'Progressive Node.js framework for building efficient, scalable, enterprise-grade applications.',
  icon: '🐱',
  languages: ['TypeScript'],
  frameworks: ['NestJS', 'Express', 'RxJS'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn'],
  defaultArchitecture: 'clean',
  supportedArchitectures: ['clean', 'modular'],
  defaultPorts: { dev: 3000 },
  commands: { dev: 'npm run start:dev', build: 'npm run build', test: 'npm test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'NestJS manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: { 'start:dev': 'nest start --watch', build: 'nest build', test: 'jest' },
        dependencies: { '@nestjs/common': '^10.0.0', '@nestjs/core': '^10.0.0', rxjs: '^7.8.0' },
      }, null, 2),
    },
    {
      id: 'main-ts',
      path: 'src/main.ts',
      description: 'Nest bootstrap',
      category: 'source',
      content: `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
`,
    },
    {
      id: 'app-module',
      path: 'src/app.module.ts',
      description: 'Nest root module',
      category: 'source',
      content: `import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}
`,
    },
  ],
};
