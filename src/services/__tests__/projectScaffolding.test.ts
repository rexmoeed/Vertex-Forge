import { describe, it, expect } from 'vitest';
import { NamingEngine } from '../namingEngine';
import { TemplateRegistry } from '../templateRegistry';
import { ArchitecturePlanner } from '../architecturePlanner';
import { ScaffoldingEngine } from '../scaffoldingEngine';
import { ScaffoldingContext } from '../../types/scaffolding';

describe('Vertex Forge New Project Engine & Scaffolding Test Suite', () => {
  // 1. Project Name Validation
  describe('Project Name Validation', () => {
    it('approves standard kebab-case and alphanumeric project names', () => {
      expect(NamingEngine.validateProjectName('customer-portal').valid).toBe(true);
      expect(NamingEngine.validateProjectName('app123').valid).toBe(true);
      expect(NamingEngine.validateProjectName('my-react-app').valid).toBe(true);
    });

    it('rejects empty or whitespace-only names', () => {
      expect(NamingEngine.validateProjectName('').valid).toBe(false);
      expect(NamingEngine.validateProjectName('   ').valid).toBe(false);
    });

    it('rejects names with illegal filesystem characters', () => {
      expect(NamingEngine.validateProjectName('my/project').valid).toBe(false);
      expect(NamingEngine.validateProjectName('app:test').valid).toBe(false);
      expect(NamingEngine.validateProjectName('project*name').valid).toBe(false);
      expect(NamingEngine.validateProjectName('test?app').valid).toBe(false);
      expect(NamingEngine.validateProjectName('name<1>').valid).toBe(false);
    });

    it('rejects reserved system names', () => {
      expect(NamingEngine.validateProjectName('node_modules').valid).toBe(false);
      expect(NamingEngine.validateProjectName('con').valid).toBe(false);
      expect(NamingEngine.validateProjectName('aux').valid).toBe(false);
      expect(NamingEngine.validateProjectName('nul').valid).toBe(false);
    });
  });

  // 2. Relative Path Validation & Directory Traversal Guards
  describe('Relative Path Validation', () => {
    it('accepts safe nested relative paths', () => {
      expect(NamingEngine.validateRelativePath('src/components/Button.tsx').valid).toBe(true);
      expect(NamingEngine.validateRelativePath('package.json').valid).toBe(true);
      expect(NamingEngine.validateRelativePath('app/api/routes.py').valid).toBe(true);
    });

    it('rejects directory traversal attempts', () => {
      expect(NamingEngine.validateRelativePath('../secret.env').valid).toBe(false);
      expect(NamingEngine.validateRelativePath('src/../../etc/passwd').valid).toBe(false);
    });

    it('rejects absolute paths with root or drive letters', () => {
      expect(NamingEngine.validateRelativePath('/etc/config').valid).toBe(false);
      expect(NamingEngine.validateRelativePath('C:/Windows').valid).toBe(false);
    });
  });

  // 3. Language & Framework Naming Conventions
  describe('Naming Conventions Engine', () => {
    it('formats React components in PascalCase', () => {
      expect(NamingEngine.formatFileName('task card', 'react-component')).toBe('TaskCard.tsx');
      expect(NamingEngine.formatFileName('user_profile', 'react-component')).toBe('UserProfile.tsx');
    });

    it('formats React hooks with use prefix and camelCase', () => {
      expect(NamingEngine.formatFileName('auth', 'react-hook')).toBe('useAuth.ts');
      expect(NamingEngine.formatFileName('useDebounce', 'react-hook')).toBe('useDebounce.ts');
    });

    it('formats Python modules in snake_case', () => {
      expect(NamingEngine.formatFileName('TaskService', 'python')).toBe('task_service.py');
    });

    it('formats Dart files in snake_case', () => {
      expect(NamingEngine.formatFileName('UserRepository', 'dart')).toBe('user_repository.dart');
    });

    it('formats Go files in snake_case', () => {
      expect(NamingEngine.formatFileName('OrderHandler', 'go')).toBe('order_handler.go');
    });
  });

  // 4. Template Registry Verification
  describe('Template Registry Manifest Generation', () => {
    it('contains templates for all 4 project domains', () => {
      const all = TemplateRegistry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(5);

      const web = TemplateRegistry.getByCategory('web');
      const mobile = TemplateRegistry.getByCategory('mobile');
      const backend = TemplateRegistry.getByCategory('backend');
      const fullstack = TemplateRegistry.getByCategory('fullstack');

      expect(web.length).toBeGreaterThan(0);
      expect(mobile.length).toBeGreaterThan(0);
      expect(backend.length).toBeGreaterThan(0);
      expect(fullstack.length).toBeGreaterThan(0);
    });

    it('generates valid web React + Vite starter files', () => {
      const template = TemplateRegistry.getById('web-react-vite')!;
      expect(template).toBeDefined();

      const ctx: ScaffoldingContext = {
        projectName: 'web-test',
        projectDescription: 'Test web app',
        destinationPath: '/workspace/projects/web-test',
        parentDir: '/workspace/projects',
        templateId: 'web-react-vite',
        category: 'web',
        architecture: 'feature-based',
        packageManager: 'npm',
        initGit: true,
        selectedLibraries: ['tailwind'],
      };

      const manifest = template.generateManifest(ctx);
      expect(manifest.length).toBeGreaterThan(5);

      // Verify crucial files
      const paths = manifest.map(m => m.path);
      expect(paths).toContain('package.json');
      expect(paths).toContain('tsconfig.json');
      expect(paths).toContain('vite.config.ts');
      expect(paths).toContain('src/App.tsx');
      expect(paths).toContain('src/main.tsx');
      expect(paths).toContain('README.md');
      expect(paths).toContain('.env.example');

      // Verify README content
      const readme = manifest.find(m => m.path === 'README.md')!;
      expect(readme.content).toContain('web-test');
      expect(readme.content).toContain('npm run dev');
    });

    it('generates valid Python FastAPI starter files', () => {
      const template = TemplateRegistry.getById('backend-fastapi')!;
      expect(template).toBeDefined();

      const ctx: ScaffoldingContext = {
        projectName: 'api-service',
        projectDescription: 'FastAPI microservice',
        destinationPath: '/workspace/projects/api-service',
        parentDir: '/workspace/projects',
        templateId: 'backend-fastapi',
        category: 'backend',
        architecture: 'modular',
        packageManager: 'pip',
        initGit: true,
        selectedLibraries: [],
      };

      const manifest = template.generateManifest(ctx);
      const paths = manifest.map(m => m.path);

      expect(paths).toContain('requirements.txt');
      expect(paths).toContain('app/main.py');
      expect(paths).toContain('app/api/routes.py');
      expect(paths).toContain('tests/test_main.py');
      expect(paths).toContain('pyproject.toml');
    });

    it('generates valid Expo mobile starter files', () => {
      const template = TemplateRegistry.getById('mobile-expo')!;
      expect(template).toBeDefined();

      const ctx: ScaffoldingContext = {
        projectName: 'mobile-app',
        projectDescription: 'Cross-platform app',
        destinationPath: '/workspace/projects/mobile-app',
        parentDir: '/workspace/projects',
        templateId: 'mobile-expo',
        category: 'mobile',
        architecture: 'feature-based',
        packageManager: 'npm',
        initGit: true,
        selectedLibraries: [],
      };

      const manifest = template.generateManifest(ctx);
      const paths = manifest.map(m => m.path);

      expect(paths).toContain('package.json');
      expect(paths).toContain('app.json');
      expect(paths).toContain('app/index.tsx');
    });

    it('generates valid Flutter mobile starter files', () => {
      const template = TemplateRegistry.getById('mobile-flutter')!;
      expect(template).toBeDefined();

      const ctx: ScaffoldingContext = {
        projectName: 'flutter_app',
        projectDescription: 'Flutter mobile client',
        destinationPath: '/workspace/projects/flutter_app',
        parentDir: '/workspace/projects',
        templateId: 'mobile-flutter',
        category: 'mobile',
        architecture: 'feature-based',
        packageManager: 'go',
        initGit: true,
        selectedLibraries: [],
      };

      const manifest = template.generateManifest(ctx);
      const paths = manifest.map(m => m.path);

      expect(paths).toContain('pubspec.yaml');
      expect(paths).toContain('lib/main.dart');
      expect(paths).toContain('test/widget_test.dart');
    });

    it('generates valid Go Gin backend starter files', () => {
      const template = TemplateRegistry.getById('backend-go')!;
      expect(template).toBeDefined();

      const ctx: ScaffoldingContext = {
        projectName: 'go_api',
        projectDescription: 'Go Gin backend service',
        destinationPath: '/workspace/projects/go_api',
        parentDir: '/workspace/projects',
        templateId: 'backend-go',
        category: 'backend',
        architecture: 'modular',
        packageManager: 'go',
        initGit: true,
        selectedLibraries: [],
      };

      const manifest = template.generateManifest(ctx);
      const paths = manifest.map(m => m.path);

      expect(paths).toContain('go.mod');
      expect(paths).toContain('cmd/api/main.go');
      expect(paths).toContain('cmd/api/main_test.go');
    });

    it('generates valid Rust Axum backend starter files', () => {
      const template = TemplateRegistry.getById('backend-rust')!;
      expect(template).toBeDefined();

      const ctx: ScaffoldingContext = {
        projectName: 'rust_api',
        projectDescription: 'Rust Axum service',
        destinationPath: '/workspace/projects/rust_api',
        parentDir: '/workspace/projects',
        templateId: 'backend-rust',
        category: 'backend',
        architecture: 'modular',
        packageManager: 'cargo',
        initGit: true,
        selectedLibraries: [],
      };

      const manifest = template.generateManifest(ctx);
      const paths = manifest.map(m => m.path);

      expect(paths).toContain('Cargo.toml');
      expect(paths).toContain('src/main.rs');
    });

    it('generates valid Fullstack Next.js + Database starter files', () => {
      const template = TemplateRegistry.getById('fullstack-next-db')!;
      expect(template).toBeDefined();

      const ctx: ScaffoldingContext = {
        projectName: 'fullstack-db',
        projectDescription: 'Next.js Prisma SQLite stack',
        destinationPath: '/workspace/projects/fullstack-db',
        parentDir: '/workspace/projects',
        templateId: 'fullstack-next-db',
        category: 'fullstack',
        architecture: 'modular',
        packageManager: 'npm',
        initGit: true,
        selectedLibraries: [],
      };

      const manifest = template.generateManifest(ctx);
      const paths = manifest.map(m => m.path);

      expect(paths).toContain('package.json');
      expect(paths).toContain('prisma/schema.prisma');
      expect(paths).toContain('src/app/page.tsx');
    });
  });

  // 5. Architecture Planner & Revision
  describe('AI Architecture Planner', () => {
    it('produces complexity-aware architectural blueprints', async () => {
      const ctx: ScaffoldingContext = {
        projectName: 'enterprise-saas',
        projectDescription: 'Enterprise multi-tenant RBAC platform with microservices',
        destinationPath: '/workspace/projects/enterprise-saas',
        parentDir: '/workspace/projects',
        templateId: 'web-react-vite',
        category: 'web',
        architecture: 'feature-based',
        packageManager: 'npm',
        initGit: true,
        selectedLibraries: ['zustand', 'tailwind'],
      };

      const plan = await ArchitecturePlanner.planArchitecture(ctx);
      expect(plan.complexity).toBe('large');
      expect(plan.boundaries.frontend).toBeDefined();
      expect(plan.entryPoints.length).toBeGreaterThan(0);
      expect(plan.files.length).toBeGreaterThan(0);
    });

    it('revises plan interactively based on natural language instructions', async () => {
      const ctx: ScaffoldingContext = {
        projectName: 'client-app',
        projectDescription: 'Basic client app',
        destinationPath: '/workspace/projects/client-app',
        parentDir: '/workspace/projects',
        templateId: 'web-react-vite',
        category: 'web',
        architecture: 'modular',
        packageManager: 'npm',
        initGit: false,
        selectedLibraries: [],
      };

      const initialPlan = await ArchitecturePlanner.planArchitecture(ctx);
      const revisedPlan = ArchitecturePlanner.revisePlan(
        initialPlan,
        'Move all API logic into a services folder',
        ctx
      );

      const hasService = revisedPlan.files.some(f => f.path.startsWith('src/services/'));
      expect(hasService).toBe(true);
    });
  });
});
