import { VaultSecret, VaultAuditEntry, SecretType, SecretAccessPolicy } from '../types/kos';

const VAULT_STORAGE_KEY = 'vertex_credential_vault_v1';
const VAULT_AUDIT_KEY = 'vertex_vault_audit_log_v1';

export class CredentialVaultService {
  private static secrets: VaultSecret[] = [];
  private static auditLog: VaultAuditEntry[] = [];
  private static sessionApproved: Set<string> = new Set();

  static {
    this.loadFromStorage();
  }

  private static loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(VAULT_STORAGE_KEY);
        if (stored) {
          this.secrets = JSON.parse(stored);
        }
        const auditStored = localStorage.getItem(VAULT_AUDIT_KEY);
        if (auditStored) {
          this.auditLog = JSON.parse(auditStored);
        }
      }
    } catch (e) {
      console.warn('Failed to load credential vault from storage:', e);
    }

    // Default seeded secrets for development if empty
    if (this.secrets.length === 0) {
      this.secrets = [
        {
          id: 'secret-gemini-default',
          name: 'gemini-api-key',
          type: 'api_key',
          maskedPreview: 'AIza••••••••••••9v2Q',
          encryptedValue: 'MOCK_ENC_VAL_GEMINI',
          iv: 'default_iv',
          policy: 'auto_within_scope',
          createdAt: Date.now() - 86400000,
          notes: 'Primary Google Gemini AI Studio provider key',
        },
        {
          id: 'secret-openrouter-default',
          name: 'openrouter-api-key',
          type: 'api_key',
          maskedPreview: 'sk-or-••••••••••••83af',
          encryptedValue: 'MOCK_ENC_VAL_OPENROUTER',
          iv: 'default_iv',
          policy: 'ask_once_per_session',
          createdAt: Date.now() - 43200000,
          notes: 'OpenRouter Aggregator access token',
        },
      ];
      this.saveToStorage();
    }
  }

  private static saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(this.secrets));
        localStorage.setItem(VAULT_AUDIT_KEY, JSON.stringify(this.auditLog));
      }
    } catch (e) {
      console.warn('Failed to save credential vault to storage:', e);
    }
  }

  public static listSecrets(): Omit<VaultSecret, 'encryptedValue' | 'iv'>[] {
    return this.secrets.map(({ encryptedValue, iv, ...safe }) => safe);
  }

  public static addSecret(
    name: string,
    rawSecret: string,
    type: SecretType,
    policy: SecretAccessPolicy = 'ask_once_per_session',
    businessId?: string,
    notes?: string
  ): VaultSecret {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const trimmed = rawSecret.trim();
    
    // Create preview
    const preview = trimmed.length > 8
      ? `${trimmed.slice(0, 4)}••••••••••••${trimmed.slice(-4)}`
      : '••••••••';

    // Simple reversible base64 obfuscation for local prototype / secure encryption representation
    const fakeCipher = btoa(encodeURIComponent(trimmed));

    const newSecret: VaultSecret = {
      id: `secret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      type,
      maskedPreview: preview,
      encryptedValue: fakeCipher,
      iv: 'local-iv-vector',
      policy,
      scopeBusinessId: businessId,
      createdAt: Date.now(),
      notes,
    };

    this.secrets.push(newSecret);
    this.recordAudit(newSecret.id, newSecret.name, 'create', 'user', true);
    this.saveToStorage();
    return newSecret;
  }

  public static deleteSecret(id: string): boolean {
    const idx = this.secrets.findIndex(s => s.id === id);
    if (idx === -1) return false;
    const removed = this.secrets.splice(idx, 1)[0];
    this.recordAudit(removed.id, removed.name, 'delete', 'user', true);
    this.saveToStorage();
    return true;
  }

  public static requestSecretInjection(
    secretName: string,
    caller: 'agent' | 'user' | 'system' = 'agent',
    toolName?: string
  ): { granted: boolean; rawSecret?: string; reason?: string } {
    const cleanName = secretName.replace(/^vault:/, '').trim().toLowerCase();
    const secret = this.secrets.find(s => s.name === cleanName);

    if (!secret) {
      return { granted: false, reason: `Vault secret not found: "${cleanName}"` };
    }

    if (secret.policy === 'always_ask' && caller === 'agent') {
      this.recordAudit(secret.id, secret.name, 'inject', caller, false, toolName);
      return { granted: false, reason: `Secret "${cleanName}" requires explicit owner authorization per call.` };
    }

    if (secret.policy === 'ask_once_per_session' && caller === 'agent') {
      if (!this.sessionApproved.has(secret.id)) {
        this.sessionApproved.add(secret.id);
        this.recordAudit(secret.id, secret.name, 'inject', caller, true, toolName);
      }
    } else {
      this.recordAudit(secret.id, secret.name, 'inject', caller, true, toolName);
    }

    // Decrypt
    let decoded = '';
    try {
      decoded = decodeURIComponent(atob(secret.encryptedValue));
    } catch {
      decoded = secret.encryptedValue;
    }

    secret.lastUsedAt = Date.now();
    this.saveToStorage();
    return { granted: true, rawSecret: decoded };
  }

  public static redactSecrets(text: string): string {
    if (!text || typeof text !== 'string') return text;
    let redacted = text;

    for (const secret of this.secrets) {
      try {
        const raw = decodeURIComponent(atob(secret.encryptedValue));
        if (raw && raw.length > 5) {
          redacted = redacted.split(raw).join(`[REDACTED_SECRET:${secret.name.toUpperCase()}]`);
        }
      } catch {}
    }

    // General high-entropy API key patterns redaction
    redacted = redacted.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GEMINI_KEY]');
    redacted = redacted.replace(/sk-[a-zA-Z0-9]{32,64}/g, '[REDACTED_OPENAI_KEY]');
    redacted = redacted.replace(/sk-ant-[a-zA-Z0-9-_]{40,}/g, '[REDACTED_ANTHROPIC_KEY]');
    redacted = redacted.replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]');

    return redacted;
  }

  public static getAuditLog(): VaultAuditEntry[] {
    return [...this.auditLog].reverse();
  }

  private static recordAudit(
    secretId: string,
    secretName: string,
    action: VaultAuditEntry['action'],
    requester: VaultAuditEntry['requester'],
    granted: boolean,
    callerTool?: string
  ) {
    const entry: VaultAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      secretId,
      secretName,
      action,
      requester,
      callerTool,
      granted,
      timestamp: Date.now(),
    };
    this.auditLog.push(entry);
    if (this.auditLog.length > 200) {
      this.auditLog.shift();
    }
  }
}
