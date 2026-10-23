import {
  CanonicalProjectProfile,
  TestFrameworkInfo,
  ProjectDetectionResult,
} from './profiles';
import {
  CodebaseMap,
  Workspace,
  FileSystemService,
} from './codebase';
import {
  AiModel,
  AiProvider,
  AiTool,
  AiRuntime,
  AiIntent,
  ModelCapabilities,
  ModelReference,
  ProviderConnectionResult,
  AutonomyPolicy,
  EditorSelection,
  AiRuntimeRequest,
  AiRuntimeResult,
} from './aiRuntime';

export interface TerminalCreateRequest {
  cwd?: string;
  shell?: string;
  env?: Record<string, string>;
}

export interface TerminalSession {
  id: string;
  pid: number;
  cwd: string;
  createdAt: number;
}

export interface TerminalExecuteRequest {
  command: string;
  cwd?: string;
  sessionId?: string;
  timeoutMs?: number;
}

export interface TerminalCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface TerminalReadOptions {
  lines?: number;
  clearAfterRead?: boolean;
}

export interface TerminalOutput {
  lines: string[];
  text: string;
}

export interface TerminalService {
  create(request: TerminalCreateRequest): Promise<TerminalSession>;
  execute(request: TerminalExecuteRequest): Promise<TerminalCommandResult>;
  write(sessionId: string, input: string): Promise<void>;
  read(sessionId: string, options?: TerminalReadOptions): Promise<TerminalOutput>;
  interrupt(sessionId: string): Promise<void>;
  stop(sessionId: string): Promise<void>;
  list(): Promise<TerminalSession[]>;
}

export type ServerState =
  | 'starting'
  | 'ready'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'unknown';

export interface ManagedServer {
  id: string;
  workspaceId: string;
  name: string;
  command: string;
  cwd: string;
  pid?: number;
  port?: number;
  url?: string;
  state: ServerState;
  terminalSessionId: string;
  startedAt?: number;
  lastError?: string;
}

export interface ServerStartRequest {
  workspaceId: string;
  command: string;
  cwd?: string;
  name?: string;
  port?: number;
}

export interface ServerStatus {
  serverId: string;
  state: ServerState;
  port?: number;
  uptimeSeconds?: number;
}

export interface ServerManager {
  start(request: ServerStartRequest): Promise<ManagedServer>;
  stop(serverId: string): Promise<void>;
  restart(serverId: string): Promise<ManagedServer>;
  status(serverId: string): Promise<ServerStatus>;
  list(workspaceId: string): Promise<ManagedServer[]>;
  logs(serverId: string): Promise<TerminalOutput>;
}

// ==========================================
// 9. GIT & VERIFICATION
// ==========================================

export interface GitStatus {
  branch: string;
  modified: string[];
  staged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface GitDiff {
  files: Array<{ path: string; diffText: string; additions: number; deletions: number }>;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
}

export interface GitCommitResult {
  hash: string;
  success: boolean;
  message?: string;
}

export interface GitService {
  isRepository(rootPath: string): Promise<boolean>;
  status(rootPath: string): Promise<GitStatus>;
  diff(rootPath: string): Promise<GitDiff>;
  branches(rootPath: string): Promise<GitBranch[]>;
  checkout(rootPath: string, branch: string): Promise<void>;
  commit(rootPath: string, message: string): Promise<GitCommitResult>;
}

export interface TestRunRequest {
  workspaceId: string;
  command?: string;
  testFiles?: string[];
}

export interface TestRunResult {
  runId: string;
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  output: string;
}

export interface TestService {
  detect(workspaceId: string): Promise<TestFrameworkInfo[]>;
  run(request: TestRunRequest): Promise<TestRunResult>;
  getResult(runId: string): Promise<TestRunResult | undefined>;
}

export interface BuildService {
  run(workspaceId: string, command?: string): Promise<{ success: boolean; output: string; exitCode: number }>;
}

export interface VerificationCriterion {
  type:
    | 'file-exists'
    | 'file-content'
    | 'command-success'
    | 'server-ready'
    | 'test-pass'
    | 'build-pass'
    | 'git-state';
  description: string;
  target?: string;
}

export interface VerificationRequest {
  workspaceId: string;
  criteria: VerificationCriterion[];
}

export interface VerificationResult {
  verified: boolean;
  passedCriteria: string[];
  failedCriteria: string[];
  details: string;
}

export interface VerificationService {
  verify(request: VerificationRequest): Promise<VerificationResult>;
}

// ==========================================
// 10. ROUTING, REGISTRY & AGENTS
// ==========================================

export interface ModelRoutingRequest {
  intent: AiIntent;
  preferredRole?:
    | 'default'
    | 'agent'
    | 'coding'
    | 'fast'
    | 'review'
    | 'terminal'
    | 'architecture';
  requiredCapabilities?: Partial<ModelCapabilities>;
}

export interface ModelRouter {
  resolve(request: ModelRoutingRequest): Promise<ModelReference>;
}

export interface ProviderRegistry {
  register(provider: AiProvider): void;
  unregister(providerId: string): void;
  get(providerId: string): AiProvider | undefined;
  list(): AiProvider[];
  test(providerId: string): Promise<ProviderConnectionResult>;
}

export interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyCredentialId: string;
  modelId: string;
  organizationId?: string;
  apiVersion?: string;
  authentication: 'bearer' | 'api-key-header' | 'custom-header';
  authenticationHeader?: string;
  customHeaders?: Record<string, string>;
  protocol: 'openai-chat-completions' | 'openai-responses' | 'custom';
  streaming: boolean;
  enabled: boolean;
}

export interface CredentialStore {
  set(credentialId: string, secret: string): Promise<void>;
  get(credentialId: string): Promise<string | undefined>;
  delete(credentialId: string): Promise<void>;
  exists(credentialId: string): Promise<boolean>;
}

export type AgentRole =
  | 'orchestrator'
  | 'architect'
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'database'
  | 'debugger'
  | 'qa'
  | 'security'
  | 'devops'
  | 'reviewer'
  | 'documentation';

export interface AgentTask {
  id: string;
  description: string;
  workspaceId: string;
  parentTaskId?: string;
  dependencies?: string[];
  allowedTools: string[];
  autonomy: AutonomyPolicy;
  successCriteria: string[];
}

export interface AgentContext {
  workspace: CanonicalProjectProfile;
  aiRuntime: AiRuntime;
  agentRole: AgentRole;
}

export interface AgentResult {
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'blocked';
  summary: string;
  changedFiles: string[];
  commandsExecuted: string[];
  testsRun: string[];
  verification: VerificationResult;
  error?: string;
}

export interface Agent {
  id: string;
  role: AgentRole;
  execute(task: AgentTask, context: AgentContext): Promise<AgentResult>;
}

// ==========================================
// 11. WATCHER, EDITOR STATE & EVENTS
// ==========================================

export interface FileSystemEvent {
  type: 'created' | 'changed' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string;
  timestamp: number;
}

export interface ProjectWatcher {
  start(workspaceId: string): Promise<void>;
  stop(workspaceId: string): Promise<void>;
  onEvent(handler: (event: FileSystemEvent) => void): () => void;
}

export interface EditorFileState {
  path: string;
  language: string;
  content: string;
  dirty: boolean;
  source: 'disk' | 'buffer';
}

export interface EditorContextService {
  getActiveFile(): Promise<EditorFileState | null>;
  getOpenFiles(): Promise<EditorFileState[]>;
  getSelection(): Promise<EditorSelection | null>;
}

export type AiEnvironmentEvent =
  | { type: 'workspace-changed'; workspaceId: string }
  | { type: 'file-changed'; path: string }
  | { type: 'editor-changed'; path: string }
  | { type: 'terminal-output'; sessionId: string }
  | { type: 'server-state-changed'; serverId: string }
  | { type: 'git-changed'; workspaceId: string }
  | { type: 'project-profile-updated'; workspaceId: string };

export interface AiProviderSummary {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  credentialConfigured: boolean;
  defaultModel?: string;
  modelCount?: number;
}

export interface AiProviderApi {
  list(): Promise<AiProviderSummary[]>;
  add(config: any): Promise<AiProviderSummary>;
  update(providerId: string, config: any): Promise<AiProviderSummary>;
  remove(providerId: string): Promise<void>;
  test(providerId: string): Promise<ProviderConnectionResult>;
  models(providerId: string): Promise<AiModel[]>;
}

export interface ElectronApi {
  ai: {
    execute(request: AiRuntimeRequest): Promise<AiRuntimeResult>;
    cancel(requestId: string): Promise<void>;
  };
  project: {
    detect(rootPath: string): Promise<ProjectDetectionResult>;
    open(path: string): Promise<Workspace>;
  };
  filesystem: FileSystemService;
  terminal: TerminalService;
  git: GitService;
}
