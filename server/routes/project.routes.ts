import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

export function createProjectRouter(): Router {
  const router = Router();

  router.post('/api/project/detect', async (req: Request, res: Response) => {
    const { rootPath } = req.body;
    const targetDir = rootPath ? path.resolve(rootPath) : process.cwd();

    try {
      let pkg: any = {};
      const pkgPath = path.join(targetDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const raw = await fsPromises.readFile(pkgPath, 'utf-8');
        try { pkg = JSON.parse(raw); } catch (e) {}
      }

      const files = await fsPromises.readdir(targetDir).catch(() => []);
      const hasFile = (f: string) => fs.existsSync(path.join(targetDir, f));

      // Detect package manager
      let packageManager = 'npm';
      if (hasFile('pnpm-lock.yaml')) packageManager = 'pnpm';
      else if (hasFile('yarn.lock')) packageManager = 'yarn';
      else if (hasFile('bun.lock') || hasFile('bun.lockb')) packageManager = 'bun';
      else if (hasFile('package-lock.json')) packageManager = 'npm';

      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const languages = ['TypeScript', 'JavaScript'];
      const frameworks: string[] = [];

      if (deps['next'] || hasFile('next.config.js') || hasFile('next.config.mjs')) frameworks.push('Next.js');
      if (deps['react'] && (deps['vite'] || hasFile('vite.config.ts'))) frameworks.push('React 19 + Vite');
      else if (deps['react']) frameworks.push('React');
      if (deps['vue']) frameworks.push('Vue');
      if (deps['@angular/core'] || hasFile('angular.json')) frameworks.push('Angular');
      if (deps['@sveltejs/kit'] || hasFile('svelte.config.js')) frameworks.push('SvelteKit');
      if (deps['express']) frameworks.push('Express');
      if (deps['fastify']) frameworks.push('Fastify');
      if (deps['@nestjs/core']) frameworks.push('NestJS');
      if (hasFile('requirements.txt')) frameworks.push('Python');
      if (hasFile('go.mod')) frameworks.push('Go');
      if (hasFile('Cargo.toml')) frameworks.push('Rust');

      return res.json({
        rootPath: targetDir,
        name: pkg.name || path.basename(targetDir),
        packageManager,
        frameworks: frameworks.length > 0 ? frameworks : ['Modern Web Application'],
        languages,
        scripts: pkg.scripts || {},
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
        hasPackageJson: Object.keys(pkg).length > 0,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg || 'Failed to detect project' });
    }
  });

  return router;
}
