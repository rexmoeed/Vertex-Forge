export type Archetype = 
  | 'fullstack-saas' 
  | 'web-react' 
  | 'web-next' 
  | 'mobile-react-native' 
  | 'mobile-flutter' 
  | 'backend-fastapi' 
  | 'backend-nest';

export type AgentRole = 
  | 'Architect' 
  | 'Developer' 
  | 'Frontend' 
  | 'Backend' 
  | 'Mobile' 
  | 'Testing' 
  | 'Debugger' 
  | 'Reviewer' 
  | 'DocGen';

export type AutonomyMode = 'assist' | 'supervised' | 'autonomous' | 'strict';

export type OrchestratorStatus = 
  | 'idle' 
  | 'planning' 
  | 'executing' 
  | 'testing' 
  | 'self_correcting' 
  | 'awaiting_approval' 
  | 'completed'
  | 'error';

export interface TechStackConfig {
  archetype?: Archetype;
  frontend: string;
  backend?: string;
  database?: string;
  testRunner?: string;
  styling?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  runtime?: 'node' | 'python' | 'dart' | 'deno' | 'bun';
  state?: string;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  language?: string;
  isModified?: boolean;
}

export interface OpenTab {
  id: string;
  filePath: string;
  title: string;
  language?: string;
  isDirty?: boolean;
  diffMode?: boolean;
  originalContent?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  agent: AgentRole;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'paused';
  targetFile?: string;
  toolAction?: 'create_file' | 'modify_file' | 'run_command' | 'run_test' | 'install_dep';
  toolPayload?: any;
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  resultSummary?: string;
  verificationEvidence?: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agent: AgentRole;
  action: string;
  details?: string;
  status: 'info' | 'tool_call' | 'approval_needed' | 'success' | 'warning' | 'error';
  targetFile?: string;
}

export interface ProblemDiagnostic {
  id: string;
  filePath: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source: string;
  ruleId?: string;
  fixAvailable?: boolean;
  codeSnippet?: string;
}

export interface TestResult {
  id: string;
  testSuite: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  filePath: string;
  line?: number;
  errorStack?: string;
  expected?: string;
  actual?: string;
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  filesChanged: string[];
}

export interface GitDiff {
  filePath: string;
  original: string;
  modified: string;
  additions: number;
  deletions: number;
}

export interface TerminalLine {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'system';
  text: string;
  timestamp: string;
}

export interface ProjectMemory {
  purpose: string;
  requirements: string[];
  architecturalDecisions: string[];
  codingConventions: string[];
  importantDecisions?: string[];
  knownRisks: string[];
  testCommands: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: TechStackConfig;
  rootFiles: FileNode[];
  createdAt?: string;
  updatedAt?: string;
  memory?: ProjectMemory;
}
