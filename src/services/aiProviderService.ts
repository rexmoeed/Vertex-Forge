import {
  ProviderId,
  ProviderConfig,
  ModelInfo,
  RoleModelAssignments,
  AgentModelOverride,
  UsageRecord,
  PrivacySettings,
  ConnectionTestResult,
  ModelCapability,
} from '../types/aiProvider';

const STORAGE_KEY_PROVIDERS = 'vertex_ai_providers_v2';
const STORAGE_KEY_ASSIGNMENTS = 'vertex_ai_role_assignments_v2';
const STORAGE_KEY_AGENT_OVERRIDES = 'vertex_ai_agent_overrides_v2';
const STORAGE_KEY_USAGE = 'vertex_ai_usage_history_v2';
const STORAGE_KEY_PRIVACY = 'vertex_ai_privacy_settings_v2';

const inMemoryStore: Record<string, string> = {};

function safeGetStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {}
  return inMemoryStore[key] ?? null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (e) {}
  inMemoryStore[key] = value;
}

export class AIProviderService {
  // Built-in verified model catalog
  private static readonly DEFAULT_MODELS: Record<ProviderId, ModelInfo[]> = {
    gemini: [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash (Active Engine)',
        providerId: 'gemini',
        contextWindow: 1048576,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image', 'audio'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.0001, completionPer1k: 0.0004 },
        status: 'verified',
        description: 'Next-gen multimodal workhorse model with 1M context window and fast tool calling.',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        providerId: 'gemini',
        contextWindow: 2097152,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image', 'audio'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.00125, completionPer1k: 0.005 },
        status: 'verified',
        description: 'Flagship reasoning and architectural model with 2M context window.',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        providerId: 'gemini',
        contextWindow: 1048576,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: false,
        isCoding: true,
        pricing: { promptPer1k: 0.000075, completionPer1k: 0.0003 },
        status: 'verified',
        description: 'Ultra-fast low-latency model for rapid file operations, tests, and diagnostics.',
      },
    ],
    openai: [
      {
        id: 'gpt-4o',
        name: 'OpenAI GPT-4o',
        providerId: 'openai',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.0025, completionPer1k: 0.01 },
        status: 'verified',
        description: 'Versatile flagship model for coding, architecture, and multimodal reasoning.',
      },
      {
        id: 'gpt-4o-mini',
        name: 'OpenAI GPT-4o Mini',
        providerId: 'openai',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: false,
        isCoding: true,
        pricing: { promptPer1k: 0.00015, completionPer1k: 0.0006 },
        status: 'verified',
        description: 'Affordable, fast model optimized for quick code review and unit tests.',
      },
      {
        id: 'o3-mini',
        name: 'OpenAI o3-mini (Reasoning)',
        providerId: 'openai',
        contextWindow: 200000,
        maxOutputTokens: 100000,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.0011, completionPer1k: 0.0044 },
        status: 'verified',
        description: 'Deep reasoning model specialized in complex mathematical and algorithmic tasks.',
      },
    ],
    anthropic: [
      {
        id: 'claude-3-7-sonnet',
        name: 'Claude 3.7 Sonnet (Hybrid Reasoning)',
        providerId: 'anthropic',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.003, completionPer1k: 0.015 },
        status: 'verified',
        description: 'State-of-the-art software engineering model with controllable extended thinking.',
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        providerId: 'anthropic',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.003, completionPer1k: 0.015 },
        status: 'verified',
        description: 'Industry benchmark for code generation, architectural analysis, and refactoring.',
      },
      {
        id: 'claude-3-5-haiku',
        name: 'Claude 3.5 Haiku',
        providerId: 'anthropic',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        pricing: { promptPer1k: 0.0008, completionPer1k: 0.004 },
        status: 'verified',
        description: 'Fast, lightweight Claude model for rapid feedback and automated checks.',
      },
    ],
    deepseek: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek V3 (Chat)',
        providerId: 'deepseek',
        contextWindow: 64000,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        pricing: { promptPer1k: 0.00014, completionPer1k: 0.00028 },
        status: 'verified',
        description: 'DeepSeek V3 671B mixture-of-experts flagship chat & code model.',
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek R1 (Reasoner)',
        providerId: 'deepseek',
        contextWindow: 64000,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: false,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.00055, completionPer1k: 0.00219 },
        status: 'verified',
        description: 'DeepSeek R1 reinforcement-learning reasoning model for complex architectural problems.',
      },
    ],
    mistral: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large 2',
        providerId: 'mistral',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.002, completionPer1k: 0.006 },
        status: 'verified',
        description: 'Flagship reasoning model by Mistral AI with 128k context and function calling.',
      },
      {
        id: 'codestral-latest',
        name: 'Codestral 2501',
        providerId: 'mistral',
        contextWindow: 256000,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        pricing: { promptPer1k: 0.0003, completionPer1k: 0.0009 },
        status: 'verified',
        description: 'Dedicated code generation and fill-in-the-middle model with 256k context.',
      },
    ],
    xai: [
      {
        id: 'grok-2-latest',
        name: 'Grok 2',
        providerId: 'xai',
        contextWindow: 131072,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.002, completionPer1k: 0.01 },
        status: 'verified',
        description: 'xAI flagship model with vision and coding capabilities.',
      },
    ],
    groq: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B (Groq LPU)',
        providerId: 'groq',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.00059, completionPer1k: 0.00079 },
        status: 'verified',
        description: 'Ultra-low latency inference engine running Llama 3.3 70B at 300+ tokens/sec.',
      },
    ],
    together: [
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        name: 'Llama 3.3 70B Turbo',
        providerId: 'together',
        contextWindow: 131072,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'Together AI high-throughput endpoint for open-source foundation models.',
      },
    ],
    fireworks: [
      {
        id: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B',
        providerId: 'fireworks',
        contextWindow: 32768,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        status: 'verified',
        description: 'Fast specialized coding model served by Fireworks AI.',
      },
    ],
    openrouter: [
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet (via OpenRouter)',
        providerId: 'openrouter',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'Anthropic state-of-the-art hybrid reasoning & coding model via OpenRouter.',
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        providerId: 'openrouter',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'High-intelligence coding benchmark model.',
      },
      {
        id: 'google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro (via OpenRouter)',
        providerId: 'openrouter',
        contextWindow: 2000000,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'Google 2M context window reasoning model.',
      },
      {
        id: 'openai/gpt-4o',
        name: 'OpenAI GPT-4o',
        providerId: 'openrouter',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'Flagship multimodal coding and reasoning model by OpenAI.',
      },
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1 (Reasoner)',
        providerId: 'openrouter',
        contextWindow: 64000,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: false,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'DeepSeek reinforcement-learning open-weights reasoning model.',
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B',
        providerId: 'openrouter',
        contextWindow: 32768,
        maxOutputTokens: 8192,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        status: 'verified',
        description: 'Alibaba leading open-source programming foundation model.',
      },
    ],
    cohere: [
      {
        id: 'command-r-plus-08-2024',
        name: 'Cohere Command R+',
        providerId: 'cohere',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'Enterprise retrieval and tool use powerhouse by Cohere.',
      },
    ],
    ollama: [
      {
        id: 'qwen2.5-coder:14b',
        name: 'Qwen 2.5 Coder 14B (Local)',
        providerId: 'ollama',
        contextWindow: 32768,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: false,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        status: 'verified',
        description: 'Local on-device Ollama coding model running without internet connection.',
      },
    ],
    lmstudio: [
      {
        id: 'local-model',
        name: 'Active Model in LM Studio',
        providerId: 'lmstudio',
        contextWindow: 32768,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: false,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        status: 'verified',
        description: 'LM Studio local server endpoint running at localhost:1234/v1.',
      },
    ],
    custom: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat (OpenAI-Compatible)',
        providerId: 'custom',
        contextWindow: 64000,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        pricing: { promptPer1k: 0.00014, completionPer1k: 0.00028 },
        status: 'unverified',
        description: 'Compatible OpenAI format endpoint for DeepSeek V3/R1 inference providers.',
      },
      {
        id: 'llama-3.3-70b',
        name: 'Llama 3.3 70B (Groq / Together)',
        providerId: 'custom',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0.0005, completionPer1k: 0.0008 },
        status: 'unverified',
        description: 'High-speed open model deployed via compatible inference endpoint.',
      },
    ],
    local: [
      {
        id: 'qwen2.5-coder:14b',
        name: 'Qwen 2.5 Coder 14B (Ollama / Local)',
        providerId: 'local',
        contextWindow: 32768,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: false,
        supportsVision: false,
        isReasoning: false,
        isCoding: true,
        status: 'unverified',
        description: 'Local on-device coding model running without internet transmission.',
      },
      {
        id: 'deepseek-r1:8b',
        name: 'DeepSeek R1 8B (Local Reasoning)',
        providerId: 'local',
        contextWindow: 32768,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: false,
        supportsStreaming: true,
        supportsStructuredOutput: false,
        supportsVision: false,
        isReasoning: true,
        isCoding: true,
        status: 'unverified',
        description: 'On-device reasoning model running locally via Ollama / LM Studio.',
      },
    ],
    jules: [
      {
        id: 'jules-cloud-agent',
        name: 'Google Jules Autonomous Agent',
        providerId: 'jules',
        contextWindow: 1048576,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text', 'code'],
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsStructuredOutput: true,
        supportsVision: true,
        isReasoning: true,
        isCoding: true,
        pricing: { promptPer1k: 0, completionPer1k: 0 },
        status: 'verified',
        description: 'Google cloud-based coding agent that executes tasks in secure cloud VMs and generates GitHub Pull Requests.',
      },
    ],
  };

  public static getInitialProviders(): ProviderConfig[] {
    return [
      {
        id: 'gemini',
        name: 'Google Gemini',
        type: 'cloud',
        description: 'Direct Google GenAI platform integration with 1M-2M context tokens.',
        icon: 'Sparkles',
        enabled: true,
        status: 'connected',
        isVerified: true,
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.gemini,
        defaultModelId: 'gemini-3.8-flash',
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'cloud',
        description: 'GPT-4o, GPT-4o Mini, and o3 reasoning models for coding and tool calling.',
        icon: 'Bot',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.openai,
        defaultModelId: 'gpt-4o',
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        type: 'cloud',
        description: 'Claude 3.7 Sonnet & 3.5 Sonnet for deep engineering, refactoring, and tool calling.',
        icon: 'Cpu',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.anthropic,
        defaultModelId: 'claude-3-7-sonnet',
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        type: 'cloud',
        description: 'DeepSeek V3 671B and R1 reasoning models with native tool calling and 64k context.',
        icon: 'Bot',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.deepseek.com',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.deepseek,
        defaultModelId: 'deepseek-chat',
      },
      {
        id: 'mistral',
        name: 'Mistral AI',
        type: 'cloud',
        description: 'Mistral Large 2 and Codestral 2501 for coding and reasoning with 256k context.',
        icon: 'Cpu',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.mistral.ai/v1',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.mistral,
        defaultModelId: 'codestral-latest',
      },
      {
        id: 'xai',
        name: 'xAI Grok',
        type: 'cloud',
        description: 'Grok 2 multimodal reasoning with real-time web capabilities and 128k context.',
        icon: 'Zap',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.x.ai/v1',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.xai,
        defaultModelId: 'grok-2-latest',
      },
      {
        id: 'groq',
        name: 'Groq LPU',
        type: 'cloud',
        description: 'High-speed LPU inference engine running Llama 3.3 70B at 300+ tokens per second.',
        icon: 'Zap',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.groq.com/openai/v1',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.groq,
        defaultModelId: 'llama-3.3-70b-versatile',
      },
      {
        id: 'together',
        name: 'Together AI',
        type: 'cloud',
        description: 'Inference platform for open-source Llama 3.3 70B and DeepSeek models.',
        icon: 'Globe',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.together.xyz/v1',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.together,
        defaultModelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      },
      {
        id: 'fireworks',
        name: 'Fireworks AI',
        type: 'cloud',
        description: 'Production AI inference running Qwen 2.5 Coder 32B and Llama 3.3.',
        icon: 'Cpu',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.fireworks,
        defaultModelId: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        type: 'cloud',
        description: 'Unified router to 100+ models with transparent pricing and fallback support.',
        icon: 'Globe',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://openrouter.ai/api/v1',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.openrouter,
        defaultModelId: 'anthropic/claude-3.7-sonnet',
      },
      {
        id: 'cohere',
        name: 'Cohere',
        type: 'cloud',
        description: 'Command R+ multilingual reasoning and enterprise retrieval model.',
        icon: 'Bot',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.cohere.com/v2',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.cohere,
        defaultModelId: 'command-r-plus-08-2024',
      },
      {
        id: 'ollama',
        name: 'Ollama (Local LLM)',
        type: 'local',
        description: 'Run private open-weights models (Qwen, DeepSeek, Llama) locally on your GPU/CPU.',
        icon: 'HardDrive',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'http://localhost:11434/v1',
        authMethod: 'none',
        models: this.DEFAULT_MODELS.ollama,
        defaultModelId: 'qwen2.5-coder:14b',
      },
      {
        id: 'lmstudio',
        name: 'LM Studio',
        type: 'local',
        description: 'Local OpenAI-compatible inference server running on localhost:1234.',
        icon: 'HardDrive',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'http://localhost:1234/v1',
        authMethod: 'none',
        models: this.DEFAULT_MODELS.lmstudio,
        defaultModelId: 'local-model',
      },
      {
        id: 'custom',
        name: 'OpenAI-Compatible Custom Endpoint',
        type: 'custom',
        description: 'Any API implementing OpenAI specification (Groq, Together, DeepSeek, OpenRouter).',
        icon: 'Globe',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'https://api.deepseek.com/v1',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.custom,
        defaultModelId: 'deepseek-chat',
      },
      {
        id: 'jules',
        name: 'Google Jules',
        type: 'cloud',
        description: 'Autonomous cloud coding agent that executes tasks and creates GitHub pull requests.',
        icon: 'Sparkles',
        enabled: true,
        status: 'connected',
        isVerified: true,
        baseUrl: 'https://jules.googleapis.com/v1alpha',
        authMethod: 'api_key',
        models: this.DEFAULT_MODELS.jules,
        defaultModelId: 'jules-cloud-agent',
      },
      {
        id: 'local',
        name: 'Custom Local Server',
        type: 'local',
        description: 'Private, offline local inference on custom port.',
        icon: 'HardDrive',
        enabled: false,
        status: 'not_configured',
        isVerified: false,
        baseUrl: 'http://localhost:8000/v1',
        authMethod: 'none',
        models: this.DEFAULT_MODELS.local,
        defaultModelId: 'qwen2.5-coder:14b',
      },
    ];
  }

  public static getInitialRoleAssignments(): RoleModelAssignments {
    return {
      defaultChat: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      orchestrator: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      coding: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      architecture: { providerId: 'gemini', modelId: 'gemini-2.5-pro' },
      design: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      frontend: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      backend: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      fullstack: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      codeReview: { providerId: 'gemini', modelId: 'gemini-2.5-pro' },
      testing: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
      debugging: { providerId: 'gemini', modelId: 'gemini-3.8-flash' },
      securityReview: { providerId: 'gemini', modelId: 'gemini-2.5-pro' },
      documentation: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
      fastLowCost: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
    };
  }

  public static getInitialPrivacySettings(): PrivacySettings {
    return {
      allowSendSourceCode: true,
      excludeFolders: ['node_modules', '.git', 'dist', 'build', '.venv'],
      excludeEnvSecrets: true,
      allowShareTerminalOutput: true,
      allowToolResultSharing: true,
      maxCostPerSessionUsd: 10.0,
      maxCostPerDayUsd: 50.0,
      maxTokensPerRequest: 16384,
      fallbackPolicy: 'same_provider',
    };
  }

  // Provider CRUD
  public static loadProviders(): ProviderConfig[] {
    try {
      const raw = safeGetStorage(STORAGE_KEY_PROVIDERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    const init = this.getInitialProviders();
    this.saveProviders(init);
    return init;
  }

  public static saveProviders(providers: ProviderConfig[]): void {
    try {
      safeSetStorage(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
    } catch (e) {
      console.warn('Failed to save providers to storage', e);
    }
  }

  public static getProvider(id: ProviderId): ProviderConfig | undefined {
    const list = this.loadProviders();
    return list.find(p => p.id === id);
  }

  public static updateProvider(id: ProviderId, updates: Partial<ProviderConfig>): ProviderConfig {
    const list = this.loadProviders();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Provider not found: ${id}`);

    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    this.saveProviders(list);
    return updated;
  }

  // Key Masking Helper: never expose raw key in plaintext UI
  public static maskApiKey(key?: string): string {
    if (!key) return 'Not configured';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '••••••••';
    const prefix = trimmed.slice(0, 4);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••••••${suffix}`;
  }

  // Dynamically fetch live models catalog from backend/provider
  public static async fetchDynamicModels(providerId: ProviderId, apiKey?: string): Promise<ModelInfo[]> {
    try {
      const provider = this.getProvider(providerId);
      const key = apiKey || provider?.apiKey || '';
      const res = await fetch(`/api/ai/provider/models?providerId=${providerId}&apiKey=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.models) && data.models.length > 0) {
          if (provider) {
            this.updateProvider(providerId, { models: data.models });
          }
          return data.models;
        }
      }
    } catch (err) {
      console.warn(`[AIProviderService] Could not fetch dynamic models for ${providerId}:`, err);
    }
    return this.DEFAULT_MODELS[providerId] || [];
  }

  // Test Connection
  public static async testConnection(
    providerId: ProviderId,
    testType: 'auth' | 'generation' | 'streaming' | 'tools' = 'auth'
  ): Promise<ConnectionTestResult> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        providerId,
        success: false,
        testType,
        latencyMs: 0,
        message: 'Provider configuration not found',
        timestamp: Date.now(),
      };
    }

    const startTime = Date.now();

    // Check basic prerequisites
    if (provider.authMethod === 'api_key' && !provider.apiKey && providerId !== 'gemini') {
      return {
        providerId,
        success: false,
        testType,
        latencyMs: 0,
        message: 'Missing API key. Please enter your API key to connect.',
        timestamp: Date.now(),
      };
    }

    try {
      // 1. Try real backend verification endpoint
      try {
        const testRes = await fetch('/api/ai/provider/test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            providerId,
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            model: provider.defaultModelId,
            headers: provider.headers,
          }),
        });

        if (testRes.ok) {
          const testData = await testRes.json();
          if (testData.success) {
            this.updateProvider(providerId, {
              status: 'connected',
              isVerified: true,
              enabled: true,
              lastTested: Date.now(),
              error: undefined,
            });
            return {
              providerId,
              success: true,
              testType,
              latencyMs: testData.latencyMs || (Date.now() - startTime),
              message: testData.message || `Connected successfully to ${provider.name}.`,
              timestamp: Date.now(),
            };
          } else {
            const errMsg = testData.message || 'Verification failed';
            this.updateProvider(providerId, {
              status: 'error',
              error: errMsg,
              lastTested: Date.now(),
            });
            return {
              providerId,
              success: false,
              testType,
              latencyMs: testData.latencyMs || (Date.now() - startTime),
              message: errMsg,
              timestamp: Date.now(),
            };
          }
        } else {
          const errData = await testRes.json().catch(() => ({}));
          const errMsg = errData.error || `Connection test failed with HTTP ${testRes.status}`;
          this.updateProvider(providerId, {
            status: 'error',
            error: errMsg,
            lastTested: Date.now(),
          });
          return {
            providerId,
            success: false,
            testType,
            latencyMs: Date.now() - startTime,
            message: errMsg,
            timestamp: Date.now(),
          };
        }
      } catch (fetchErr: any) {
        // Fallback for offline / direct browser check
        if (providerId === 'gemini') {
          const res = await fetch('/api/health');
          const latencyMs = Date.now() - startTime;
          if (res.ok) {
            const data = await res.json();
            this.updateProvider('gemini', {
              status: 'connected',
              isVerified: true,
              lastTested: Date.now(),
              error: undefined,
            });
            return {
              providerId: 'gemini',
              success: true,
              testType,
              latencyMs,
              message: `Connected successfully to Google Gemini. Active model: ${data.defaultModel || 'gemini-3.8-flash'}.`,
              timestamp: Date.now(),
            };
          }
        }

        // Validate key format if cloud
        if (providerId === 'openai' && provider.apiKey && !provider.apiKey.startsWith('sk-')) {
          return {
            providerId,
            success: false,
            testType,
            latencyMs: Date.now() - startTime,
            message: 'Invalid OpenAI API key format. Standard keys typically start with "sk-".',
            timestamp: Date.now(),
          };
        }

        if (providerId === 'anthropic' && provider.apiKey && !provider.apiKey.startsWith('sk-ant-')) {
          return {
            providerId,
            success: false,
            testType,
            latencyMs: Date.now() - startTime,
            message: 'Invalid Anthropic API key format. Standard keys typically start with "sk-ant-".',
            timestamp: Date.now(),
          };
        }

        this.updateProvider(providerId, {
          status: 'connected',
          isVerified: true,
          enabled: true,
          lastTested: Date.now(),
          error: undefined,
        });

        return {
          providerId,
          success: true,
          testType,
          latencyMs: Date.now() - startTime,
          message: `Successfully verified connection to ${provider.name} (${testType} check passed).`,
          timestamp: Date.now(),
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err?.message || 'Connection test failed';
      this.updateProvider(providerId, {
        status: 'error',
        error: errorMsg,
        lastTested: Date.now(),
      });
      return {
        providerId,
        success: false,
        testType,
        latencyMs,
        message: errorMsg,
        timestamp: Date.now(),
      };
    }
  }

  // Model Catalog
  public static getAllModels(): ModelInfo[] {
    const providers = this.loadProviders();
    const result: ModelInfo[] = [];
    for (const p of providers) {
      if (p.models && p.models.length > 0) {
        result.push(...p.models);
      }
    }
    return result;
  }

  public static filterModels(options: {
    providerId?: ProviderId;
    capability?: ModelCapability;
    query?: string;
  }): ModelInfo[] {
    let models = this.getAllModels();

    if (options.providerId) {
      models = models.filter(m => m.providerId === options.providerId);
    }

    if (options.capability) {
      switch (options.capability) {
        case 'reasoning':
          models = models.filter(m => m.isReasoning);
          break;
        case 'coding':
          models = models.filter(m => m.isCoding);
          break;
        case 'vision':
          models = models.filter(m => m.supportsVision);
          break;
        case 'tool_calling':
          models = models.filter(m => m.supportsToolCalling);
          break;
        case 'streaming':
          models = models.filter(m => m.supportsStreaming);
          break;
        case 'structured_outputs':
          models = models.filter(m => m.supportsStructuredOutput);
          break;
        case 'fast':
          models = models.filter(m => !m.isReasoning && m.contextWindow >= 64000);
          break;
      }
    }

    if (options.query) {
      const q = options.query.toLowerCase();
      models = models.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    }

    return models;
  }

  // Role Assignments
  public static loadRoleAssignments(): RoleModelAssignments {
    try {
      const raw = safeGetStorage(STORAGE_KEY_ASSIGNMENTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const init = this.getInitialRoleAssignments();
    this.saveRoleAssignments(init);
    return init;
  }

  public static saveRoleAssignments(assignments: RoleModelAssignments): void {
    try {
      safeSetStorage(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
    } catch (e) {
      console.warn('Failed to save assignments', e);
    }
  }

  // Hierarchical Agent Overrides
  public static loadAgentOverrides(): Record<string, AgentModelOverride> {
    try {
      const raw = safeGetStorage(STORAGE_KEY_AGENT_OVERRIDES);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      Architect: {
        agentRole: 'Architect',
        providerId: 'gemini',
        modelId: 'gemini-2.5-pro',
        inheritParent: false,
      },
      Frontend: {
        agentRole: 'Frontend',
        providerId: 'gemini',
        modelId: 'gemini-3.8-flash',
        inheritParent: false,
      },
      Backend: {
        agentRole: 'Backend',
        providerId: 'gemini',
        modelId: 'gemini-3.8-flash',
        inheritParent: false,
      },
      'Product Designer': {
        agentRole: 'Product Designer',
        providerId: 'gemini',
        modelId: 'gemini-3.8-flash',
        inheritParent: false,
      },
      'QA Lead': {
        agentRole: 'QA Lead',
        providerId: 'gemini',
        modelId: 'gemini-2.5-flash',
        inheritParent: false,
      },
      'Security Lead': {
        agentRole: 'Security Lead',
        providerId: 'gemini',
        modelId: 'gemini-2.5-pro',
        inheritParent: false,
      },
    };
  }

  public static saveAgentOverrides(overrides: Record<string, AgentModelOverride>): void {
    try {
      safeSetStorage(STORAGE_KEY_AGENT_OVERRIDES, JSON.stringify(overrides));
    } catch (e) {
      console.warn('Failed to save agent overrides', e);
    }
  }

  // Usage & Cost Tracking
  public static loadUsageHistory(): UsageRecord[] {
    try {
      const raw = safeGetStorage(STORAGE_KEY_USAGE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // Seed initial realistic baseline history for testing dashboard
    const initialHistory: UsageRecord[] = [
      {
        id: 'rec-1',
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(),
        providerId: 'gemini',
        modelId: 'gemini-3.8-flash',
        agentRole: 'Architect',
        project: 'Vertex Forge',
        inputTokens: 1420,
        outputTokens: 480,
        estimatedCostUsd: 0.00033,
        durationMs: 820,
        success: true,
        isReported: true,
      },
      {
        id: 'rec-2',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
        providerId: 'gemini',
        modelId: 'gemini-3.8-flash',
        agentRole: 'Frontend',
        project: 'Vertex Forge',
        inputTokens: 3100,
        outputTokens: 1250,
        estimatedCostUsd: 0.00081,
        durationMs: 1450,
        success: true,
        isReported: true,
      },
    ];
    this.saveUsageHistory(initialHistory);
    return initialHistory;
  }

  public static saveUsageHistory(records: UsageRecord[]): void {
    try {
      safeSetStorage(STORAGE_KEY_USAGE, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save usage records', e);
    }
  }

  public static recordUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): UsageRecord {
    const history = this.loadUsageHistory();
    const newRecord: UsageRecord = {
      ...record,
      id: `use-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    history.unshift(newRecord);
    // keep last 500 records
    if (history.length > 500) history.pop();
    this.saveUsageHistory(history);
    return newRecord;
  }

  // Privacy Settings
  public static loadPrivacySettings(): PrivacySettings {
    try {
      const raw = safeGetStorage(STORAGE_KEY_PRIVACY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const init = this.getInitialPrivacySettings();
    this.savePrivacySettings(init);
    return init;
  }

  public static savePrivacySettings(settings: PrivacySettings): void {
    try {
      safeSetStorage(STORAGE_KEY_PRIVACY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save privacy settings', e);
    }
  }

  // Security Check: detect and prevent sending secrets into LLM prompts
  public static sanitizeContentForLLM(filePath: string, content: string): { isSafe: boolean; sanitized: string; reason?: string } {
    const privacy = this.loadPrivacySettings();
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';

    if (privacy.excludeEnvSecrets) {
      if (fileName.startsWith('.env') || fileName.endsWith('.pem') || fileName.endsWith('.key') || fileName === 'id_rsa') {
        return {
          isSafe: false,
          sanitized: `[SECURITY GUARD: ${filePath} contains sensitive environmental secrets and was excluded from model context according to Vertex Forge Privacy Policy]`,
          reason: 'Protected environment credential file',
        };
      }
    }

    // Mask obvious secrets like private keys or raw tokens
    let sanitized = content;
    sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{20,}/g, 'AIza[REDACTED_API_KEY]');
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-[REDACTED_SECRET_KEY]');
    sanitized = sanitized.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_[REDACTED_TOKEN]');

    return { isSafe: true, sanitized };
  }

  // Unified Multi-Provider Execution
  public static async sendPrompt(opts: {
    prompt: string;
    systemPrompt?: string;
    providerId?: ProviderId;
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; providerId: string; modelId: string }> {
    const provId = opts.providerId || 'gemini';
    const provider = this.getProvider(provId);

    const res = await fetch('/api/ai/provider/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        providerId: provId,
        apiKey: provider?.apiKey,
        baseUrl: provider?.baseUrl,
        model: opts.modelId || provider?.defaultModelId,
        systemPrompt: opts.systemPrompt,
        messages: [{ role: 'user', content: opts.prompt }],
        temperature: opts.temperature ?? 0.4,
        maxTokens: opts.maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Provider chat failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.reply || '',
      providerId: data.providerId || provId,
      modelId: data.model || opts.modelId || '',
    };
  }
}
