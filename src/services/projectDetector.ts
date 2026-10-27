import {
  ProjectProfile,
  SupportedPackageManager,
  TechnologyProfile,
  ProjectHealth,
  ProjectHealthItem,
  DetectionContext,
  DetectionResult,
} from '../types/project';
import { logger } from './logger';
import {
  ProjectDetector,
  PackageManagerDetector,
  FrontendFrameworkDetector,
  MobileFrameworkDetector,
  BackendAndDatabaseDetector,
} from './project/frameworkDetectors';
import {
  ProjectAdapter,
  UniversalProjectAdapter,
} from './project/universalProjectAdapter';

export type { ProjectDetector, ProjectAdapter };
export {
  PackageManagerDetector,
  FrontendFrameworkDetector,
  MobileFrameworkDetector,
  BackendAndDatabaseDetector,
  UniversalProjectAdapter,
};

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
      } catch (err: unknown) {
        logger.warn(`Detector ${detector.name} failed:`, { detector: detector.name }, err);
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
