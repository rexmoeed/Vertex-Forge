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

export interface CodeSymbol {
  id: string;
  name: string;
  kind:
    | 'function'
    | 'class'
    | 'interface'
    | 'type'
    | 'component'
    | 'hook'
    | 'method'
    | 'variable'
    | 'constant'
    | 'enum'
    | 'route'
    | 'module'
    | 'unknown';
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  exported: boolean;
  parentSymbolId?: string;
}

export interface CodeFile {
  path: string;
  relativePath: string;
  language: string;
  size: number;
  lineCount: number;
  imports: string[];
  exports: string[];
  symbols: string[];
  isEntryPoint: boolean;
  isTest: boolean;
  isConfig: boolean;
  isGenerated: boolean;
  lastModified: number;
}

export interface ImportEdge {
  from: string;
  to: string;
  symbols?: string[];
  type: 'static' | 'dynamic' | 'require' | 'type' | 'unknown';
}

export interface ReferenceEdge {
  symbolId: string;
  filePath: string;
  line: number;
  column: number;
  kind: 'call' | 'import' | 'extends' | 'implements' | 'usage' | 'route' | 'unknown';
}

export interface RouteInfo {
  path: string;
  method?: string;
  filePath: string;
  line: number;
}

export interface ComponentInfo {
  name: string;
  filePath: string;
  line: number;
}

export interface CodebaseMap {
  files: Map<string, CodeFile>;
  symbols: Map<string, CodeSymbol>;
  imports: ImportEdge[];
  references: ReferenceEdge[];
  routes: RouteInfo[];
  components: ComponentInfo[];
  generatedAt: number;
  version: number;
}

export interface CodeSearchRequest {
  query: string;
  mode: 'text' | 'regex' | 'semantic' | 'symbol' | 'path' | 'auto';
  rootPath: string;
  include?: string[];
  exclude?: string[];
  maxResults?: number;
}

export interface FileSearchRequest {
  query: string;
  rootPath: string;
  maxResults?: number;
}

export interface FileSearchResult {
  path: string;
  name: string;
}

export interface SymbolSearchRequest {
  query: string;
  kind?: string;
  filePath?: string;
}

export interface CodeSearchResult {
  matches: Array<{ filePath: string; line: number; column: number; text: string; snippet?: string }>;
  query: string;
  mode: string;
  durationMs: number;
}

export interface CodeSearchService {
  search(request: CodeSearchRequest): Promise<CodeSearchResult>;
  findFiles(request: FileSearchRequest): Promise<FileSearchResult[]>;
  findSymbols(request: SymbolSearchRequest): Promise<CodeSymbol[]>;
  findReferences(symbolId: string): Promise<ReferenceEdge[]>;
  findImports(filePath: string): Promise<ImportEdge[]>;
  findDependents(filePath: string): Promise<string[]>;
}

export interface IndexOptions {
  include?: string[];
  exclude?: string[];
  maxDepth?: number;
}

export interface IndexResult {
  fileCount: number;
  symbolCount: number;
  durationMs: number;
}

export interface IndexStatus {
  state: 'idle' | 'indexing' | 'updating' | 'error';
  filesIndexed: number;
  symbolsIndexed: number;
  progress: number;
  error?: string;
  updatedAt: number;
}

export interface ProjectIndexer {
  index(rootPath: string, options?: IndexOptions): Promise<IndexResult>;
  updateFile(filePath: string): Promise<void>;
  removeFile(filePath: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<void>;
  getMap(rootPath: string): Promise<CodebaseMap>;
  getStatus(rootPath: string): Promise<IndexStatus>;
}

// ==========================================
// 3. FILESYSTEM & WORKSPACE
// ==========================================

export interface ReadFileRequest {
  path: string;
  workspaceId?: string;
  encoding?: string;
}

export interface FileReadResult {
  content: string;
  path: string;
  size: number;
  lastModified: number;
}

export interface WriteFileRequest {
  path: string;
  content: string;
  workspaceId?: string;
  createDirectories?: boolean;
}

export interface FileWriteResult {
  success: boolean;
  path: string;
  bytesWritten: number;
}

export interface CreateFileRequest {
  path: string;
  initialContent?: string;
  workspaceId?: string;
}

export interface CreateDirectoryRequest {
  path: string;
  workspaceId?: string;
}

export interface DeleteRequest {
  path: string;
  workspaceId?: string;
  recursive?: boolean;
}

export interface RenameRequest {
  oldPath: string;
  newPath: string;
  workspaceId?: string;
}

export interface CopyRequest {
  sourcePath: string;
  destinationPath: string;
  workspaceId?: string;
}

export interface MoveRequest {
  sourcePath: string;
  destinationPath: string;
  workspaceId?: string;
}

export interface ListDirectoryRequest {
  path: string;
  workspaceId?: string;
  recursive?: boolean;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface DirectoryListing {
  path: string;
  entries: DirectoryEntry[];
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  error?: string;
}

export interface FileSystemService {
  readFile(request: ReadFileRequest): Promise<FileReadResult>;
  writeFile(request: WriteFileRequest): Promise<FileWriteResult>;
  createFile(request: CreateFileRequest): Promise<FileOperationResult>;
  createDirectory(request: CreateDirectoryRequest): Promise<FileOperationResult>;
  delete(request: DeleteRequest): Promise<FileOperationResult>;
  rename(request: RenameRequest): Promise<FileOperationResult>;
  copy(request: CopyRequest): Promise<FileOperationResult>;
  move(request: MoveRequest): Promise<FileOperationResult>;
  listDirectory(request: ListDirectoryRequest): Promise<DirectoryListing>;
  exists(path: string): Promise<boolean>;
}

export interface Workspace {
  id: string;
  rootPath: string;
  name: string;
  projectProfile?: CanonicalProjectProfile;
  createdAt: number;
  lastOpenedAt: number;
}

export interface OpenWorkspaceRequest {
  rootPath: string;
  name?: string;
}

export interface WorkspaceService {
  open(request: OpenWorkspaceRequest): Promise<Workspace>;
  close(workspaceId: string): Promise<void>;
  getActive(): Promise<Workspace | null>;
  get(workspaceId: string): Promise<Workspace | null>;
  list(): Promise<Workspace[]>;
  refresh(workspaceId: string): Promise<void>;
}

// ==========================================
// 4. AI PROVIDERS & MODELS
// ==========================================

export interface ModelCapabilities {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  structuredOutput: boolean;
  reasoning: boolean;
}

export interface ModelPricing {
  promptPer1k: number;
  completionPer1k: number;
}

export interface AiModel {
  id: string;
  providerId: string;
  name: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  capabilities: ModelCapabilities;
  pricing?: ModelPricing;
}

export interface ModelReference {
  providerId: string;
  modelId: string;
}

export interface AiToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiToolResult {
  callId: string;
  success: boolean;
  output?: unknown;
  error?: { message: string; code?: string };
  metadata?: Record<string, unknown>;
}

export type AiContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'tool-call'; call: AiToolCall }
  | { type: 'tool-result'; result: AiToolResult };

export interface AiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: AiContent[];
  toolCallId?: string;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  permission: 'safe' | 'moderate' | 'sensitive' | 'destructive';
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiError {
  code: string;
  message: string;
  retryable?: boolean;
}

export type AiStreamEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'tool-call'; call: AiToolCall }
  | { type: 'tool-result'; result: AiToolResult }
  | { type: 'usage'; usage: AiUsage }
  | { type: 'error'; error: AiError }
  | { type: 'complete' };

export interface AiChatRequest {
  conversationId: string;
  model: ModelReference;
  messages: AiMessage[];
  tools?: AiToolDefinition[];
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ProviderConnectionRequest {
  providerId: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ProviderConnectionResult {
  success: boolean;
  providerId: string;
  modelId?: string;
  latencyMs?: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface AiProvider {
  id: string;
  name: string;
  listModels(): Promise<AiModel[]>;
  chat(request: AiChatRequest): AsyncIterable<AiStreamEvent>;
  testConnection(request: ProviderConnectionRequest): Promise<ProviderConnectionResult>;
  getCapabilities(modelId: string): Promise<ModelCapabilities>;
}

// ==========================================
// 5. AI RUNTIME, INTENT & CONTEXT
// ==========================================

export type AiMode = 'ask' | 'edit' | 'agent' | 'review';

export interface AutonomyPolicy {
  allowFileRead: boolean;
  allowFileWrite: boolean;
  allowTerminal: boolean;
  allowProcessControl: boolean;
  allowGit: boolean;
  allowNetwork: boolean;
  requireConfirmationForDestructive: boolean;
  maxToolCalls: number;
  maxRuntimeMs: number;
}

export interface ContextOptions {
  includeWorkspaceProfile?: boolean;
  includeActiveFile?: boolean;
  includeRecentFiles?: boolean;
  includeTerminal?: boolean;
  includeGit?: boolean;
}

export interface AiRuntimeRequest {
  requestId: string;
  workspaceId?: string;
  userMessage: string;
  mode: AiMode;
  model?: ModelReference;
  conversationId?: string;
  contextOptions?: ContextOptions;
  autonomy: AutonomyPolicy;
}

export interface AiExecutionStatus {
  requestId: string;
  status: 'idle' | 'analyzing' | 'generating' | 'tool_executing' | 'verifying' | 'completed' | 'error';
  toolCallsExecuted: number;
  elapsedMs: number;
}

export interface AiRuntimeResult {
  requestId: string;
  reply: string;
  toolResults: AiToolResult[];
  changedFiles: string[];
  executionTimeMs: number;
  usage?: AiUsage;
}

export interface AiRuntime {
  execute(request: AiRuntimeRequest): Promise<AiRuntimeResult>;
  stream(request: AiRuntimeRequest): AsyncIterable<AiStreamEvent>;
  cancel(requestId: string): Promise<void>;
  getStatus(requestId: string): Promise<AiExecutionStatus>;
}

export type AiIntent =
  | 'question'
  | 'explain'
  | 'inspect'
  | 'create'
  | 'edit'
  | 'refactor'
  | 'debug'
  | 'test'
  | 'build'
  | 'run'
  | 'server'
  | 'terminal'
  | 'git'
  | 'review'
  | 'security'
  | 'performance'
  | 'documentation'
  | 'architecture'
  | 'unknown';

export interface EditorSelection {
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  text: string;
}

export interface IntentRequest {
  userMessage: string;
  workspace?: CanonicalProjectProfile;
  activeFile?: string;
  selection?: EditorSelection;
}

export interface IntentResult {
  intent: AiIntent;
  confidence: number;
  targetFiles?: string[];
  suggestedTools?: string[];
  suggestedRole?: string;
}

export interface IntentEngine {
  classify(request: IntentRequest): Promise<IntentResult>;
}

export interface FileContext {
  path: string;
  language: string;
  content: string;
  source: 'disk' | 'editor-buffer';
  startLine?: number;
  endLine?: number;
}

export interface ContextEvidence {
  source: 'filesystem' | 'editor' | 'terminal' | 'git' | 'project-detector' | 'index' | 'user';
  description: string;
  path?: string;
  verified: boolean;
}

export interface TerminalContext {
  lastCommand?: string;
  lastOutput?: string;
  recentLogs?: string[];
}

export interface GitContext {
  branch: string;
  statusSummary: string;
  modifiedFiles: string[];
}

export interface AiContext {
  project?: CanonicalProjectProfile;
  activeFile?: FileContext;
  selection?: EditorSelection;
  relevantFiles: FileContext[];
  symbols: CodeSymbol[];
  dependencies: DependencyInfo[];
  terminal?: TerminalContext;
  git?: GitContext;
  instructions: string[];
  evidence: ContextEvidence[];
}

export interface ContextRequest {
  workspaceId?: string;
  userMessage: string;
  activeFile?: string;
  selection?: EditorSelection;
  openFiles?: string[];
  terminalSessionId?: string;
  includeGit?: boolean;
}

export interface ContextItem {
  id: string;
  type: string;
  content: string;
  relevance: number;
}

export interface ContextRetrievalRequest {
  query: string;
  workspaceId?: string;
  maxTokens?: number;
}

export interface ContextEngine {
  buildContext(request: ContextRequest): Promise<AiContext>;
  retrieve(request: ContextRetrievalRequest): Promise<ContextItem[]>;
  invalidate(workspaceId: string): Promise<void>;
}

// ==========================================
// 6. SYSTEM PROMPT BUILDER & PROMPT COMPOSER
// ==========================================

export interface SystemPromptSections {
  baseInstructions: string;
  projectSummary?: string;
  projectInstructions?: string;
  editorContext?: string;
  codeContext?: string;
  terminalContext?: string;
  gitContext?: string;
  toolInstructions?: string;
  permissionInstructions?: string;
  modelCapabilities?: string;
}

export interface PromptComposer {
  compose(sections: SystemPromptSections): string;
}

export interface SystemPromptRequest {
  workspaceId?: string;
  mode: AiMode;
  model: ModelReference;
  context: AiContext;
  tools: AiToolDefinition[];
  autonomy: AutonomyPolicy;
}

export interface SystemPromptBuilder {
  build(request: SystemPromptRequest): Promise<string>;
}

// ==========================================
// 7. AI TOOLS & EXECUTION
// ==========================================

export interface ToolExecutionContext {
  workspaceId?: string;
  requestId: string;
  agentId?: string;
  permissions: AutonomyPolicy;
  signal?: AbortSignal;
}

export interface AiTool {
  definition: AiToolDefinition;
  execute(call: AiToolCall, context: ToolExecutionContext): Promise<AiToolResult>;
}

// ==========================================
// 8. TERMINAL, SERVER & PROCESS
// ==========================================

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
