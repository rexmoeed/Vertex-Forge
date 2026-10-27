import {
  SupportedLanguage,
  SupportedPackageManager,
  TechnologyProfile,
  DetectionContext,
  DetectionResult,
} from '../../types/project';

export interface ProjectDetector {
  id: string;
  name: string;
  detect(context: DetectionContext): Promise<DetectionResult | null>;
}

// 1. Package Manager Detector
export class PackageManagerDetector implements ProjectDetector {
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
export class FrontendFrameworkDetector implements ProjectDetector {
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
export class MobileFrameworkDetector implements ProjectDetector {
  id = 'mobile-framework';
  name = 'Mobile Framework Detector';

  async detect(ctx: DetectionContext): Promise<DetectionResult | null> {
    const pkg = ctx.packageJson || {};
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const languages: SupportedLanguage[] = [];
    const frameworks: string[] = [];
    let mobile: TechnologyProfile | undefined;

    // Expo
    if (deps['expo'] || (ctx.hasFile('app.json') && deps['react-native'])) {
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
export class BackendAndDatabaseDetector implements ProjectDetector {
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
