/**
 * Concrete Implementation Interfaces — Project Intelligence, Universal AI Runtime, Tools, and System Prompt
 * Architectural Contracts for Vertex Forge
 */

// ==========================================
// 1. PROJECT PROFILE & DETECTION
// ==========================================

export type ProjectType =
  | 'web'
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'desktop'
  | 'mobile'
  | 'cli'
  | 'library'
  | 'monorepo'
  | 'serverless'
  | 'data'
  | 'infrastructure'
  | 'documentation'
  | 'unknown';

export interface LanguageInfo {
  id: string;
  name: string;
  extensions: string[];
  fileCount: number;
  percentage: number;
  confidence: number;
}

export interface DetectionEvidence {
  type:
    | 'dependency'
    | 'config'
    | 'file'
    | 'script'
    | 'import'
    | 'lockfile'
    | 'source';
  value: string;
  path?: string;
  confidence: number;
}

export interface FrameworkInfo {
  id: string;
  name: string;
  version?: string;
  category: 'frontend' | 'backend' | 'mobile' | 'desktop' | 'testing' | 'other';
  evidence: DetectionEvidence[];
  confidence: number;
}

export interface RuntimeInfo {
  name: string;
  version?: string;
  detected: boolean;
  source?: string;
}

export type PackageManager =
  | 'npm'
  | 'pnpm'
  | 'yarn'
  | 'bun'
  | 'pip'
  | 'poetry'
  | 'uv'
  | 'cargo'
  | 'go'
  | 'maven'
  | 'gradle'
  | 'dotnet'
  | 'composer'
  | 'unknown';

export interface PackageManagerInfo {
  type: PackageManager;
  version?: string;
  lockfile?: string;
  installCommand?: string;
  runCommand?: string;
  evidence: DetectionEvidence[];
}

export interface ProjectScript {
  name: string;
  command: string;
  source: string;
  workingDirectory: string;
  category:
    | 'dev'
    | 'start'
    | 'build'
    | 'test'
    | 'lint'
    | 'format'
    | 'preview'
    | 'typecheck'
    | 'other';
  confidence: number;
}

export interface EntryPoint {
  path: string;
  type:
    | 'application'
    | 'server'
    | 'frontend'
    | 'mobile'
    | 'desktop'
    | 'cli'
    | 'worker'
    | 'unknown';
  framework?: string;
  evidence: DetectionEvidence[];
  confidence: number;
}

export type ArchitecturePattern =
  | 'mvc'
  | 'clean'
  | 'layered'
  | 'feature-based'
  | 'domain-driven'
  | 'component-based'
  | 'service-based'
  | 'monorepo'
  | 'custom'
  | 'unknown';

export interface ArchitectureDirectory {
  path: string;
  role: string;
  confidence: number;
}

export interface ArchitectureLayer {
  name: string;
  paths: string[];
}

export interface ArchitectureInfo {
  patterns: ArchitecturePattern[];
  directories: ArchitectureDirectory[];
  layers: ArchitectureLayer[];
  description: string;
  confidence: number;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'runtime' | 'dev' | 'peer';
}

export interface TestFrameworkInfo {
  name: string;
  command: string;
  configFile?: string;
}

export interface BuildSystemInfo {
  name: string;
  command: string;
  configFile?: string;
}

export interface ProjectServiceInfo {
  name: string;
  type: string;
  port?: number;
}

export interface GitProjectInfo {
  isRepo: boolean;
  branch: string;
  modifiedCount: number;
  untrackedCount: number;
}

export interface MonorepoInfo {
  isMonorepo: boolean;
  packageManager?: string;
  packages: string[];
}

export interface CanonicalProjectProfile {
  id: string;
  name: string;
  rootPath: string;
  projectTypes: ProjectType[];
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  runtimes: RuntimeInfo[];
  packageManager?: PackageManagerInfo;
  entryPoints: EntryPoint[];
  scripts: ProjectScript[];
  dependencies: DependencyInfo[];
  devDependencies: DependencyInfo[];
  architecture: ArchitectureInfo;
  testFrameworks: TestFrameworkInfo[];
  buildSystems: BuildSystemInfo[];
  services: ProjectServiceInfo[];
  git?: GitProjectInfo;
  monorepo?: MonorepoInfo;
  configurationFiles: string[];
  instructionFiles: string[];
  detectedAt: number;
  lastUpdatedAt: number;
  confidence: number;
}

export interface ProjectDetectionRequest {
  rootPath: string;
  forceRefresh?: boolean;
  maxDepth?: number;
}

export interface ProjectDetectionResult {
  profile: CanonicalProjectProfile;
  evidence: DetectionEvidence[];
  warnings: string[];
}

export interface ProjectDetector {
  detect(request: ProjectDetectionRequest): Promise<ProjectDetectionResult>;
  detectLanguages(rootPath: string): Promise<LanguageInfo[]>;
  detectFrameworks(rootPath: string): Promise<FrameworkInfo[]>;
  detectPackageManager(rootPath: string): Promise<PackageManagerInfo | undefined>;
  detectEntryPoints(rootPath: string, profile?: Partial<CanonicalProjectProfile>): Promise<EntryPoint[]>;
  detectScripts(rootPath: string): Promise<ProjectScript[]>;
  detectArchitecture(rootPath: string): Promise<ArchitectureInfo>;
}

// ==========================================
// 2. CODEBASE MAP & CODE SEARCH
// ==========================================
