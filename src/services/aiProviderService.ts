import { z } from 'zod';
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
import { logger } from './logger';
import {
  DEFAULT_MODELS,
  createDefaultProviders,
  DEFAULT_ROLE_ASSIGNMENTS,
  DEFAULT_PRIVACY_SETTINGS,
} from './providers/defaultModelCatalog';
import { ProviderConnectionTester } from './providers/providerConnectionTester';
import { AIUsageAndPrivacyService } from './providers/aiUsageAndPrivacyService';

export { ProviderConnectionTester } from './providers/providerConnectionTester';
export { AIUsageAndPrivacyService } from './providers/aiUsageAndPrivacyService';

const STORAGE_KEY_PROVIDERS = 'vertex_ai_providers_v2';
const STORAGE_KEY_ASSIGNMENTS = 'vertex_ai_role_assignments_v2';
const STORAGE_KEY_AGENT_OVERRIDES = 'vertex_ai_agent_overrides_v2';

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

export class ProviderValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'ProviderValidationError';
  }
}

export const ProviderConfigUpdateSchema = z
  .object({
    apiKey: z.string().optional(),
    baseUrl: z.string().url('Invalid baseUrl format: must be a valid URL').optional().or(z.literal('')),
    enabled: z.boolean().optional(),
    selectedModel: z.string().optional(),
    customModels: z.array(z.any()).optional(),
    temperature: z.number().min(0, 'Temperature cannot be negative').max(2, 'Temperature cannot exceed 2.0').optional(),
    maxTokens: z.number().positive('maxTokens must be positive').optional(),
  })
  .passthrough();

export class AIProviderService {
  public static readonly DEFAULT_MODELS = DEFAULT_MODELS;

  public static resetToDefaults(): void {
    this.saveProviders(this.getInitialProviders());
  }

  public static getInitialProviders(): ProviderConfig[] {
    return createDefaultProviders(this.DEFAULT_MODELS);
  }

  public static getInitialRoleAssignments(): RoleModelAssignments {
    return { ...DEFAULT_ROLE_ASSIGNMENTS };
  }

  public static getInitialPrivacySettings(): PrivacySettings {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }

  public static loadProviders(): ProviderConfig[] {
    try {
      const raw = safeGetStorage(STORAGE_KEY_PROVIDERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    const init = this.getInitialProviders();
    this.saveProviders(init);
    return init;
  }

  public static validateProviderConfigUpdate(updates: Partial<ProviderConfig>): void {
    const result = ProviderConfigUpdateSchema.safeParse(updates);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new ProviderValidationError(
        `Invalid provider configuration: ${issue.path.join('.') || 'field'} - ${issue.message}`,
        result.error.format()
      );
    }
  }

  public static saveProviders(providers: ProviderConfig[]): void {
    for (const p of providers) {
      this.validateProviderConfigUpdate(p);
    }
    try {
      safeSetStorage(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
    } catch (e) {
      logger.warn('Failed to save providers to storage', e);
    }
  }

  public static getProvider(id: ProviderId): ProviderConfig | undefined {
    const list = this.loadProviders();
    return list.find(p => p.id === id);
  }

  public static updateProvider(id: ProviderId, updates: Partial<ProviderConfig>): ProviderConfig {
    this.validateProviderConfigUpdate(updates);
    const list = this.loadProviders();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Provider not found: ${id}`);

    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    this.saveProviders(list);
    return updated;
  }

  public static maskApiKey(key?: string): string {
    if (!key) return 'Not configured';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '••••••••';
    const prefix = trimmed.slice(0, 4);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••••••${suffix}`;
  }

  public static async fetchDynamicModels(providerId: ProviderId, apiKey?: string): Promise<ModelInfo[]> {
    const provider = this.getProvider(providerId);
    const customProv = apiKey && provider ? { ...provider, apiKey } : provider;
    return ProviderConnectionTester.fetchDynamicModels(
      providerId,
      customProv,
      this.DEFAULT_MODELS[providerId] || [],
      (id, updates) => this.updateProvider(id, updates)
    );
  }

  public static async testConnection(
    providerId: ProviderId,
    testType: 'auth' | 'generation' | 'streaming' | 'tools' = 'auth'
  ): Promise<ConnectionTestResult> {
    const provider = this.getProvider(providerId);
    return ProviderConnectionTester.testConnection(
      provider,
      (id, updates) => this.updateProvider(id, updates),
      testType
    );
  }

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
      logger.warn('Failed to save assignments', e);
    }
  }

  public static loadAgentOverrides(): Record<string, AgentModelOverride> {
    try {
      const raw = safeGetStorage(STORAGE_KEY_AGENT_OVERRIDES);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      Architect: { agentRole: 'Architect', providerId: 'gemini', modelId: 'gemini-2.5-pro', inheritParent: false },
      Frontend: { agentRole: 'Frontend', providerId: 'gemini', modelId: 'gemini-3.8-flash', inheritParent: false },
      Backend: { agentRole: 'Backend', providerId: 'gemini', modelId: 'gemini-3.8-flash', inheritParent: false },
      'Product Designer': { agentRole: 'Product Designer', providerId: 'gemini', modelId: 'gemini-3.8-flash', inheritParent: false },
      'QA Lead': { agentRole: 'QA Lead', providerId: 'gemini', modelId: 'gemini-2.5-flash', inheritParent: false },
      'Security Lead': { agentRole: 'Security Lead', providerId: 'gemini', modelId: 'gemini-2.5-pro', inheritParent: false },
    };
  }

  public static saveAgentOverrides(overrides: Record<string, AgentModelOverride>): void {
    try {
      safeSetStorage(STORAGE_KEY_AGENT_OVERRIDES, JSON.stringify(overrides));
    } catch (e) {
      logger.warn('Failed to save agent overrides', e);
    }
  }

  public static loadUsageHistory(): UsageRecord[] {
    return AIUsageAndPrivacyService.loadUsageHistory();
  }

  public static saveUsageHistory(records: UsageRecord[]): void {
    AIUsageAndPrivacyService.saveUsageHistory(records);
  }

  public static recordUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): UsageRecord {
    return AIUsageAndPrivacyService.recordUsage(record);
  }

  public static loadPrivacySettings(): PrivacySettings {
    return AIUsageAndPrivacyService.loadPrivacySettings();
  }

  public static savePrivacySettings(settings: PrivacySettings): void {
    AIUsageAndPrivacyService.savePrivacySettings(settings);
  }

  public static sanitizeContentForLLM(filePath: string, content: string): { isSafe: boolean; sanitized: string; reason?: string } {
    return AIUsageAndPrivacyService.sanitizeContentForLLM(filePath, content);
  }

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
