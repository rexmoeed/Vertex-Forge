import { UsageRecord, PrivacySettings } from '../../types/aiProvider';
import { logger } from '../logger';
import { DEFAULT_PRIVACY_SETTINGS } from './defaultModelCatalog';

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

export class AIUsageAndPrivacyService {
  public static loadUsageHistory(): UsageRecord[] {
    try {
      const raw = safeGetStorage(STORAGE_KEY_USAGE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

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
      logger.warn('Failed to save usage records', e);
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
    if (history.length > 500) history.pop();
    this.saveUsageHistory(history);
    return newRecord;
  }

  public static loadPrivacySettings(): PrivacySettings {
    try {
      const raw = safeGetStorage(STORAGE_KEY_PRIVACY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const init = { ...DEFAULT_PRIVACY_SETTINGS };
    this.savePrivacySettings(init);
    return init;
  }

  public static savePrivacySettings(settings: PrivacySettings): void {
    try {
      safeSetStorage(STORAGE_KEY_PRIVACY, JSON.stringify(settings));
    } catch (e) {
      logger.warn('Failed to save privacy settings', e);
    }
  }

  public static sanitizeContentForLLM(
    filePath: string,
    content: string
  ): { isSafe: boolean; sanitized: string; reason?: string } {
    const privacy = this.loadPrivacySettings();
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';

    if (privacy.excludeEnvSecrets) {
      if (
        fileName.startsWith('.env') ||
        fileName.endsWith('.pem') ||
        fileName.endsWith('.key') ||
        fileName === 'id_rsa'
      ) {
        return {
          isSafe: false,
          sanitized: `[SECURITY GUARD: ${filePath} contains sensitive environmental secrets and was excluded from model context according to Vertex Forge Privacy Policy]`,
          reason: 'Protected environment credential file',
        };
      }
    }

    let sanitized = content;
    sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{20,}/g, 'AIza[REDACTED_API_KEY]');
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-[REDACTED_SECRET_KEY]');
    sanitized = sanitized.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_[REDACTED_TOKEN]');

    return { isSafe: true, sanitized };
  }
}
