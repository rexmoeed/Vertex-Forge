import { CanonicalProjectProfile, DependencyInfo } from './profiles';
import { CodeSymbol } from './codebase';

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
