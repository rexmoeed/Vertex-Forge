import {
  ProjectProfile,
  SupportedLanguage,
  SupportedPackageManager,
  TechnologyProfile,
  ProjectHealth,
  ProjectHealthItem,
  DetectionContext,
  DetectionResult,
} from '../types/project';
import { logger } from './logger';

export interface ProjectDetector {
  id: string;
  name: string;
  detect(context: DetectionContext): Promise<DetectionResult | null>;
}

export interface ProjectAdapter {
  id: string;
  supports(profile: ProjectProfile): boolean;
  getCommands(profile: ProjectProfile): Record<string, string>;
  getRunConfiguration(profile: ProjectProfile): { devCommand: string; defaultPort: number };
  getTestConfiguration(profile: ProjectProfile): { testCommand: string };
  getBuildConfiguration(profile: ProjectProfile): { buildCommand: string };
}

// 1. Package Manager Detector
class PackageManagerDetector implements ProjectDetector {
  id = 'package-manager';
  name = 'Package Manager Detector';

  async detect(ctx: DetectionContext): Promise<DetectionResult | null> {
    let pm: SupportedPackageManager = 'npm';
    if (ctx.hasFile('pnpm-lock.yaml')) {
      pm = 'pnpm';
    } else if (ctx.hasFile('yarn.lock')) {
      pm = 'yarn';
    } else if (ctx.hasFile('bun.lock') || ctx.hasFile('bun.lockb')) {
      pm = 'bun';
    } else if (ctx.hasFile('package-lock.json')) {
      pm = 'npm';
    } else if (ctx.hasFile('Pipfile') || ctx.hasFile('pyproject.toml') || ctx.hasFile('requirements.txt')) {
      pm = ctx.hasFile('poetry.lock') ? 'poetry' : 'pip';
    } else if (ctx.hasFile('Cargo.toml')) {
      pm = 'cargo';
    } else if (ctx.hasFile('go.mod')) {
      pm = 'go';
    } else if (ctx.hasFile('build.gradle') || ctx.hasFile('build.gradle.kts')) {
      pm = 'gradle';
    } else if (ctx.hasFile('pom.xml')) {
      pm = 'maven';
    }

    return { packageManager: pm, confidence: 1 };
  }
}

// 2. JavaScript / TypeScript & Frontend Detector
class FrontendFrameworkDetector implements ProjectDetector {
  id = 'frontend-framework';
  name = 'Frontend Framework Detector';

  async detect(ctx: DetectionContext): Promise<DetectionResult | null> {
    const pkg = ctx.packageJson || {};
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const languages: SupportedLanguage[] = [];
    const frameworks: string[] = [];
    const libraries: string[] = [];
    let frontend: TechnologyProfile | undefined;
    let styling: TechnologyProfile | undefined;
    let state: TechnologyProfile | undefined;
    let testing: TechnologyProfile | undefined;

    // Detect language
    if (ctx.hasFile('tsconfig.json') || Object.keys(deps).some(d => d.includes('typescript')) || ctx.files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
      languages.push('TypeScript');
    }
    if (ctx.files.some(f => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.mjs'))) {
      languages.push('JavaScript');
    }

    // Next.js
    if (deps['next'] || ctx.hasFile('next.config.js') || ctx.hasFile('next.config.mjs') || ctx.hasFile('next.config.ts')) {
      frameworks.push('Next.js');
      frontend = {
        name: 'Next.js',
        category: 'frontend',
        version: deps['next'],
        configFiles: ['next.config.js'],
        entryPoint: ctx.hasFile('app/layout.tsx') ? 'app/layout.tsx' : 'pages/_app.tsx',
      };
    }
    // Remix
    else if (deps['@remix-run/react'] || ctx.hasFile('remix.config.js')) {
      frameworks.push('Remix');
      frontend = {
        name: 'Remix',
        category: 'frontend',
        configFiles: ['remix.config.js'],
      };
    }
    // Nuxt
    else if (deps['nuxt'] || ctx.hasFile('nuxt.config.ts') || ctx.hasFile('nuxt.config.js')) {
      frameworks.push('Nuxt');
      frontend = {
        name: 'Nuxt',
        category: 'frontend',
        version: deps['nuxt'],
        configFiles: ['nuxt.config.ts'],
      };
    }
    // SvelteKit / Svelte
    else if (deps['@sveltejs/kit'] || deps['svelte'] || ctx.hasFile('svelte.config.js')) {
      frameworks.push(deps['@sveltejs/kit'] ? 'SvelteKit' : 'Svelte');
      frontend = {
        name: deps['@sveltejs/kit'] ? 'SvelteKit' : 'Svelte',
        category: 'frontend',
        version: deps['svelte'],
        configFiles: ['svelte.config.js'],
      };
    }
    // Astro
    else if (deps['astro'] || ctx.hasFile('astro.config.mjs')) {
      frameworks.push('Astro');
      frontend = {
        name: 'Astro',
        category: 'frontend',
        version: deps['astro'],
        configFiles: ['astro.config.mjs'],
      };
    }
    // Angular
    else if (deps['@angular/core'] || ctx.hasFile('angular.json')) {
      frameworks.push('Angular');
      frontend = {
        name: 'Angular',
        category: 'frontend',
        version: deps['@angular/core'],
        configFiles: ['angular.json'],
      };
    }
    // Vue (Vite or CLI)
    else if (deps['vue']) {
      frameworks.push('Vue');
      frontend = {
        name: 'Vue',
        category: 'frontend',
        version: deps['vue'],
        configFiles: ctx.hasFile('vite.config.ts') ? ['vite.config.ts'] : [],
      };
    }
    // React (Vite / CRA / standard)
    else if (deps['react']) {
      const isVite = deps['vite'] || ctx.hasFile('vite.config.ts') || ctx.hasFile('vite.config.js');
      frameworks.push(isVite ? 'React + Vite' : 'React');
      frontend = {
        name: isVite ? 'React 19 + Vite' : 'React',
        category: 'frontend',
        version: deps['react'],
        configFiles: isVite ? ['vite.config.ts'] : [],
        entryPoint: ctx.hasFile('src/main.tsx') ? 'src/main.tsx' : ctx.hasFile('src/index.tsx') ? 'src/index.tsx' : 'src/App.tsx',
      };
    }

    // Styling libraries
    if (deps['tailwindcss'] || deps['@tailwindcss/vite'] || ctx.hasFile('tailwind.config.js') || ctx.hasFile('tailwind.config.ts')) {
      styling = {
        name: 'Tailwind CSS',
        category: 'styling',
        version: deps['tailwindcss'],
        configFiles: ['tailwind.config.js'],
      };
      libraries.push('Tailwind CSS');
    } else if (deps['styled-components']) {
      styling = { name: 'styled-components', category: 'styling', configFiles: [] };
      libraries.push('styled-components');
    } else if (deps['@emotion/react']) {
      styling = { name: 'Emotion', category: 'styling', configFiles: [] };
      libraries.push('Emotion');
    }

    // State management libraries
    if (deps['zustand']) {
      state = { name: 'Zustand', category: 'state', version: deps['zustand'], configFiles: [] };
      libraries.push('Zustand');
    } else if (deps['@reduxjs/toolkit'] || deps['redux']) {
      state = { name: 'Redux Toolkit', category: 'state', version: deps['@reduxjs/toolkit'], configFiles: [] };
      libraries.push('Redux Toolkit');
    } else if (deps['pinia']) {
      state = { name: 'Pinia', category: 'state', version: deps['pinia'], configFiles: [] };
      libraries.push('Pinia');
    } else if (deps['jotai']) {
      state = { name: 'Jotai', category: 'state', version: deps['jotai'], configFiles: [] };
      libraries.push('Jotai');
    }

    // Other popular libraries
    if (deps['@tanstack/react-query']) libraries.push('TanStack Query');
    if (deps['react-router'] || deps['react-router-dom']) libraries.push('React Router');
    if (deps['zod']) libraries.push('Zod');
    if (deps['lucide-react']) libraries.push('Lucide Icons');

    // Testing frameworks
    if (deps['vitest']) {
      testing = { name: 'Vitest', category: 'testing', version: deps['vitest'], configFiles: ['vitest.config.ts'] };
      libraries.push('Vitest');
    } else if (deps['jest']) {
      testing = { name: 'Jest', category: 'testing', version: deps['jest'], configFiles: ['jest.config.js'] };
      libraries.push('Jest');
    } else if (deps['@playwright/test']) {
      testing = { name: 'Playwright', category: 'testing', version: deps['@playwright/test'], configFiles: ['playwright.config.ts'] };
      libraries.push('Playwright');
    }

    return {
      languages,
      frameworks,
      libraries,
      frontend,
      styling,
      state,
      testing,
      confidence: frameworks.length > 0 ? 0.95 : 0.4,
    };
  }
}

// 3. Mobile Framework Detector
class MobileFrameworkDetector implements ProjectDetector {
  id = 'mobile-framework';
  name = 'Mobile Framework Detector';

  async detect(ctx: DetectionContext): Promise<DetectionResult | null> {
    const pkg = ctx.packageJson || {};
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const languages: SupportedLanguage[] = [];
    const frameworks: string[] = [];
    let mobile: TechnologyProfile | undefined;

    // Expo
    if (deps['expo'] || ctx.hasFile('app.json') && deps['react-native']) {
      frameworks.push('Expo / React Native');
      languages.push('TypeScript');
      mobile = {
        name: 'Expo',
        category: 'mobile',
        version: deps['expo'],
        configFiles: ['app.json'],
        entryPoint: 'App.tsx',
      };
    }
    // React Native CLI
    else if (deps['react-native']) {
      frameworks.push('React Native');
      languages.push('TypeScript');
      mobile = {
        name: 'React Native',
        category: 'mobile',
        version: deps['react-native'],
        configFiles: ['metro.config.js'],
      };
    }
    // Flutter
    else if (ctx.hasFile('pubspec.yaml')) {
      frameworks.push('Flutter');
      languages.push('Dart');
      mobile = {
        name: 'Flutter',
        category: 'mobile',
        configFiles: ['pubspec.yaml'],
        entryPoint: 'lib/main.dart',
      };
    }
    // Native Android
    else if (ctx.hasFile('build.gradle') && ctx.hasFile('app/build.gradle')) {
      frameworks.push('Android Native');
      languages.push('Kotlin');
      mobile = {
        name: 'Android (Kotlin/Jetpack Compose)',
        category: 'mobile',
        configFiles: ['build.gradle'],
      };
    }

    if (!mobile) return null;

    return {
      languages,
      frameworks,
      mobile,
      confidence: 0.9,
    };
  }
}

// 4. Backend & Database Detector
class BackendAndDatabaseDetector implements ProjectDetector {
  id = 'backend-and-database';
  name = 'Backend & Database Detector';

  async detect(ctx: DetectionContext): Promise<DetectionResult | null> {
    const pkg = ctx.packageJson || {};
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const frameworks: string[] = [];
    const languages: SupportedLanguage[] = [];
    let backend: TechnologyProfile | undefined;
    let database: TechnologyProfile | undefined;

    // Node.js Backend Frameworks
    if (deps['@nestjs/core']) {
      frameworks.push('NestJS');
      backend = { name: 'NestJS', category: 'backend', version: deps['@nestjs/core'], configFiles: ['nest-cli.json'] };
    } else if (deps['fastify']) {
      frameworks.push('Fastify');
      backend = { name: 'Fastify', category: 'backend', version: deps['fastify'], configFiles: [] };
    } else if (deps['express']) {
      frameworks.push('Express');
      backend = { name: 'Express', category: 'backend', version: deps['express'], configFiles: [] };
    }

    // Python Backend
    if (ctx.hasFile('requirements.txt') || ctx.hasFile('pyproject.toml') || ctx.hasFile('Pipfile')) {
      languages.push('Python');
      const reqs = (await ctx.readFile('requirements.txt')) || '';
      if (reqs.includes('fastapi') || deps['fastapi']) {
        frameworks.push('FastAPI');
        backend = { name: 'Python FastAPI', category: 'backend', configFiles: ['requirements.txt'] };
      } else if (reqs.includes('django') || ctx.hasFile('manage.py')) {
        frameworks.push('Django');
        backend = { name: 'Django', category: 'backend', configFiles: ['manage.py'] };
      } else if (reqs.includes('flask')) {
        frameworks.push('Flask');
        backend = { name: 'Flask', category: 'backend', configFiles: ['requirements.txt'] };
      } else if (!backend) {
        backend = { name: 'Python Server', category: 'backend', configFiles: [] };
      }
    }

    // Go Backend
    if (ctx.hasFile('go.mod')) {
      languages.push('Go');
      frameworks.push('Go');
      backend = { name: 'Go (Golang)', category: 'backend', configFiles: ['go.mod'] };
    }

    // Rust Backend
    if (ctx.hasFile('Cargo.toml')) {
      languages.push('Rust');
      frameworks.push('Rust');
      backend = { name: 'Rust', category: 'backend', configFiles: ['Cargo.toml'] };
    }

    // Database / ORM detection
    if (ctx.hasFile('prisma/schema.prisma') || deps['@prisma/client'] || deps['prisma']) {
      database = { name: 'Prisma ORM', category: 'database', configFiles: ['prisma/schema.prisma'] };
    } else if (ctx.hasFile('drizzle.config.ts') || deps['drizzle-orm']) {
      database = { name: 'Drizzle ORM', category: 'database', configFiles: ['drizzle.config.ts'] };
    } else if (deps['@supabase/supabase-js']) {
      database = { name: 'Supabase', category: 'database', configFiles: [] };
    } else if (deps['firebase'] || ctx.hasFile('firebase.json')) {
      database = { name: 'Firebase', category: 'database', configFiles: ['firebase.json'] };
    } else if (deps['pg'] || deps['postgres']) {
      database = { name: 'PostgreSQL', category: 'database', configFiles: [] };
    } else if (deps['mysql2'] || deps['mysql']) {
      database = { name: 'MySQL', category: 'database', configFiles: [] };
    } else if (deps['mongoose'] || deps['mongodb']) {
      database = { name: 'MongoDB', category: 'database', configFiles: [] };
    } else if (deps['better-sqlite3'] || deps['sqlite3']) {
      database = { name: 'SQLite', category: 'database', configFiles: [] };
    }

    return {
      languages,
      frameworks,
      backend,
      database,
      confidence: backend || database ? 0.9 : 0.1,
    };
  }
}

// Universal Project Adapter
class UniversalProjectAdapter implements ProjectAdapter {
  id = 'universal-adapter';

  supports(profile: ProjectProfile): boolean {
    return true; // fallback for all projects
  }

  getCommands(profile: ProjectProfile): Record<string, string> {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;

    return {
      dev: profile.scripts['dev'] ? `${run} dev` : profile.scripts['start'] ? `${run} start` : 'npm run dev',
      build: profile.scripts['build'] ? `${run} build` : 'npm run build',
      test: profile.scripts['test'] ? `${run} test` : 'npm test',
      lint: profile.scripts['lint'] ? `${run} lint` : 'npm run lint',
      install: pm === 'npm' ? 'npm install' : `${pm} install`,
    };
  }

  getRunConfiguration(profile: ProjectProfile): { devCommand: string; defaultPort: number } {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;

    let port = 3000;
    if (profile.frontend?.name?.includes('Vite')) port = 5173;
    if (profile.frontend?.name?.includes('Next')) port = 3000;
    if (profile.backend?.name?.includes('FastAPI')) port = 8000;
    if (profile.backend?.name?.includes('Flask')) port = 5000;

    const devCmd = profile.scripts['dev']
      ? `${run} dev`
      : profile.scripts['start']
      ? `${run} start`
      : 'npm run dev';

    return { devCommand: devCmd, defaultPort: port };
  }

  getTestConfiguration(profile: ProjectProfile): { testCommand: string } {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;
    return {
      testCommand: profile.scripts['test'] ? `${run} test` : 'npm test',
    };
  }

  getBuildConfiguration(profile: ProjectProfile): { buildCommand: string } {
    const pm = profile.packageManager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;
    return {
      buildCommand: profile.scripts['build'] ? `${run} build` : 'npm run build',
    };
  }
}

export class ProjectDetectionEngine {
  private detectors: ProjectDetector[] = [
    new PackageManagerDetector(),
    new FrontendFrameworkDetector(),
    new MobileFrameworkDetector(),
    new BackendAndDatabaseDetector(),
  ];

  private adapter: ProjectAdapter = new UniversalProjectAdapter();

  public registerDetector(detector: ProjectDetector) {
    this.detectors.push(detector);
  }

  public async detectProject(context: DetectionContext): Promise<ProjectProfile> {
    const results: DetectionResult[] = [];

    for (const detector of this.detectors) {
      try {
        const res = await detector.detect(context);
        if (res) results.push(res);
      } catch (err) {
        logger.warn(`Detector ${detector.name} failed:`, err);
      }
    }

    // Combine results
    const languages = Array.from(new Set(results.flatMap(r => r.languages || [])));
    const frameworks = Array.from(new Set(results.flatMap(r => r.frameworks || [])));
    const libraries = Array.from(new Set(results.flatMap(r => r.libraries || [])));

    const packageManager = results.find(r => r.packageManager)?.packageManager || 'npm';
    const frontend = results.find(r => r.frontend)?.frontend;
    const backend = results.find(r => r.backend)?.backend;
    const mobile = results.find(r => r.mobile)?.mobile;
    const database = results.find(r => r.database)?.database;
    const styling = results.find(r => r.styling)?.styling;
    const state = results.find(r => r.state)?.state;
    const testing = results.find(r => r.testing)?.testing;

    const pkg = context.packageJson || {};
    const scripts = pkg.scripts || {};
    const dependencies = pkg.dependencies || {};
    const devDependencies = pkg.devDependencies || {};

    const projectName = pkg.name || context.rootPath.split('/').filter(Boolean).pop() || 'Untitled Workspace';

    // Construct Health check
    const health = this.inspectHealth(context, {
      frameworks,
      packageManager,
      testing,
    });

    const profile: ProjectProfile = {
      id: `proj-${Date.now()}`,
      rootPath: context.rootPath,
      name: projectName,
      isLocalFilesystem: true,
      languages: languages.length > 0 ? languages : ['TypeScript'],
      frameworks,
      libraries,
      packageManager,
      frontend,
      backend,
      mobile,
      database,
      styling,
      state,
      testing,
      scripts,
      dependencies,
      devDependencies,
      health,
      detectedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };

    return profile;
  }

  private inspectHealth(
    ctx: DetectionContext,
    detected: { frameworks: string[]; packageManager: SupportedPackageManager; testing?: TechnologyProfile }
  ): ProjectHealth {
    const hasPkg = ctx.hasFile('package.json');
    const hasNodeModules = ctx.hasFile('node_modules');
    const hasTsConfig = ctx.hasFile('tsconfig.json');
    const hasGit = ctx.hasFile('.git');
    const hasEnv = ctx.hasFile('.env') || ctx.hasFile('.env.local') || ctx.hasFile('.env.example');
    const hasBuild = ctx.hasFile('vite.config.ts') || ctx.hasFile('next.config.js') || ctx.hasFile('webpack.config.js') || ctx.hasFile('tsconfig.json');

    const items: ProjectHealthItem[] = [
      {
        key: 'project',
        label: 'Project detected',
        passed: detected.frameworks.length > 0 || hasPkg,
        message: detected.frameworks.join(', ') || 'Generic Workspace',
        severity: 'success',
      },
      {
        key: 'dependencies',
        label: 'Dependencies installed',
        passed: hasNodeModules,
        message: hasNodeModules ? 'node_modules directory found' : 'Run package install to populate dependencies',
        severity: hasNodeModules ? 'success' : 'warning',
      },
      {
        key: 'packageManager',
        label: 'Package manager detected',
        passed: !!detected.packageManager,
        message: `Using ${detected.packageManager}`,
        severity: 'success',
      },
      {
        key: 'typescript',
        label: 'TypeScript configuration detected',
        passed: hasTsConfig,
        message: hasTsConfig ? 'tsconfig.json present' : 'TypeScript not configured',
        severity: hasTsConfig ? 'success' : 'info',
      },
      {
        key: 'git',
        label: 'Git repository detected',
        passed: hasGit,
        message: hasGit ? 'Version control active' : 'Not a git repository',
        severity: hasGit ? 'success' : 'warning',
      },
      {
        key: 'test',
        label: 'Test framework detected',
        passed: !!detected.testing,
        message: detected.testing?.name || 'No test runner configured in package',
        severity: detected.testing ? 'success' : 'info',
      },
      {
        key: 'env',
        label: 'Environment variables configured',
        passed: hasEnv,
        message: hasEnv ? 'Environment file found' : 'No .env or .env.example found',
        severity: hasEnv ? 'success' : 'warning',
      },
      {
        key: 'build',
        label: 'Build configuration detected',
        passed: hasBuild,
        message: hasBuild ? 'Build config present' : 'Default build pipeline',
        severity: 'success',
      },
    ];

    const passedCount = items.filter(i => i.passed).length;
    const score = Math.round((passedCount / items.length) * 100);

    return {
      score,
      projectDetected: items[0].passed,
      dependenciesInstalled: items[1].passed,
      packageManagerDetected: items[2].passed,
      packageManagerName: detected.packageManager,
      typeScriptConfigured: items[3].passed,
      gitRepository: items[4].passed,
      testFrameworkDetected: items[5].passed,
      testFrameworkName: detected.testing?.name,
      envVariablesPresent: items[6].passed,
      buildConfigDetected: items[7].passed,
      items,
    };
  }

  public getAdapter(): ProjectAdapter {
    return this.adapter;
  }
}

export const GlobalProjectDetector = new ProjectDetectionEngine();
