export type ProviderId =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'mistral'
  | 'xai'
  | 'groq'
  | 'together'
  | 'fireworks'
  | 'openrouter'
  | 'cohere'
  | 'ollama'
  | 'lmstudio'
  | 'local'
  | 'jules'
  | 'custom';

export type ModelCapability =
  | 'chat'
  | 'coding'
  | 'reasoning'
  | 'vision'
  | 'tool_calling'
  | 'streaming'
  | 'structured_outputs'
  | 'fast';

export interface ModelInfo {
  id: string;
  name: string;
  providerId: ProviderId;
  contextWindow: number;
  maxOutputTokens: number;
  inputModalities: ('text' | 'image' | 'audio')[];
  outputModalities: ('text' | 'code')[];
  supportsToolCalling: boolean;
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  isReasoning: boolean;
  isCoding: boolean;
  pricing?: {
    promptPer1k: number;
    completionPer1k: number;
  };
  status: 'available' | 'verified' | 'unverified' | 'unavailable';
  description?: string;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  type: 'cloud' | 'custom' | 'local';
  description: string;
  icon: string;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  status: 'not_configured' | 'connected' | 'testing' | 'error' | 'rate_limited';
  lastTested?: number;
  error?: string;
  models: ModelInfo[];
  defaultModelId?: string;
  headers?: Record<string, string>;
  isVerified: boolean;
  authMethod: 'api_key' | 'bearer_token' | 'none';
  organizationId?: string;
  apiVersion?: string;
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
  contextLimit?: number;
}

export interface RoleModelAssignments {
  defaultChat: { providerId: ProviderId; modelId: string };
  orchestrator: { providerId: ProviderId; modelId: string };
  coding: { providerId: ProviderId; modelId: string };
  architecture: { providerId: ProviderId; modelId: string };
  design: { providerId: ProviderId; modelId: string };
  frontend: { providerId: ProviderId; modelId: string };
  backend: { providerId: ProviderId; modelId: string };
  fullstack: { providerId: ProviderId; modelId: string };
  codeReview: { providerId: ProviderId; modelId: string };
  testing: { providerId: ProviderId; modelId: string };
  debugging: { providerId: ProviderId; modelId: string };
  securityReview: { providerId: ProviderId; modelId: string };
  documentation: { providerId: ProviderId; modelId: string };
  fastLowCost: { providerId: ProviderId; modelId: string };
}

export interface AgentModelOverride {
  agentRole: string;
  providerId: ProviderId;
  modelId: string;
  fallbackProviderId?: ProviderId;
  fallbackModelId?: string;
  inheritParent: boolean;
}

export interface UsageRecord {
  id: string;
  timestamp: string;
  providerId: ProviderId;
  modelId: string;
  agentRole: string;
  project: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  success: boolean;
  error?: string;
  isReported: boolean;
}

export interface PrivacySettings {
  allowSendSourceCode: boolean;
  excludeFolders: string[];
  excludeEnvSecrets: boolean;
  allowShareTerminalOutput: boolean;
  allowToolResultSharing: boolean;
  maxCostPerSessionUsd: number;
  maxCostPerDayUsd: number;
  maxTokensPerRequest: number;
  fallbackPolicy: 'never' | 'same_provider' | 'any_provider' | 'ask';
}

export interface ConnectionTestResult {
  providerId: ProviderId;
  success: boolean;
  testType: 'auth' | 'generation' | 'streaming' | 'tools';
  latencyMs: number;
  message: string;
  details?: any;
  timestamp: number;
}
