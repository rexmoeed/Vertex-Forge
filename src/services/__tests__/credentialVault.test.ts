import { describe, it, expect, beforeEach } from 'vitest';
import { CredentialVaultService } from '../credentialVaultService';

describe('CredentialVaultService - Secure Credential Lifecycle & Access Control', () => {

  // Reset internal static state before each test
  beforeEach(() => {
    // Access internals to reset for test isolation
    (CredentialVaultService as any).secrets = [];
    (CredentialVaultService as any).auditLog = [];
    (CredentialVaultService as any).sessionApproved = new Set();
  });

  // ─── 1. Secret Creation & Storage ────────────────────────────────────
  describe('1. Secret Creation & Storage', () => {
    it('adds a new API key secret and returns a VaultSecret with masked preview', () => {
      const secret = CredentialVaultService.addSecret(
        'my-api-key',
        'sk-abcdef1234567890xyzw',
        'api_key',
        'ask_once_per_session',
        undefined,
        'Test API key'
      );

      expect(secret).toBeDefined();
      expect(secret.id).toMatch(/^secret-/);
      expect(secret.name).toBe('my-api-key');
      expect(secret.type).toBe('api_key');
      expect(secret.maskedPreview).toContain('••••');
      expect(secret.maskedPreview).toContain('sk-a');
      expect(secret.maskedPreview).toContain('xyzw');
      expect(secret.encryptedValue).not.toBe('sk-abcdef1234567890xyzw');
      expect(secret.policy).toBe('ask_once_per_session');
      expect(secret.notes).toBe('Test API key');
      expect(secret.createdAt).toBeGreaterThan(0);
    });

    it('sanitizes secret names by lowercasing and replacing special characters', () => {
      const secret = CredentialVaultService.addSecret(
        'My Secret KEY @#$!',
        'test-value-12345678',
        'api_key'
      );

      expect(secret.name).toBe('my-secret-key-----');
      expect(secret.name).not.toContain('@');
      expect(secret.name).not.toContain(' ');
    });

    it('masks short secrets (<=8 chars) with full redaction', () => {
      const secret = CredentialVaultService.addSecret('short', 'abc', 'api_key');
      expect(secret.maskedPreview).toBe('••••••••');
    });

    it('creates unique IDs for each secret added', () => {
      const s1 = CredentialVaultService.addSecret('key-1', 'value-one-secret-long', 'api_key');
      const s2 = CredentialVaultService.addSecret('key-2', 'value-two-secret-long', 'api_key');
      expect(s1.id).not.toBe(s2.id);
    });
  });

  // ─── 2. Secret Listing (Safe Projection) ────────────────────────────
  describe('2. Secret Listing (Safe Projection)', () => {
    it('lists secrets without exposing encryptedValue or iv', () => {
      CredentialVaultService.addSecret('listed-key', 'supersecretvalue1234', 'api_key');

      const list = CredentialVaultService.listSecrets();
      expect(list.length).toBeGreaterThanOrEqual(1);

      const item = list.find(s => s.name === 'listed-key');
      expect(item).toBeDefined();
      expect(item!.name).toBe('listed-key');
      expect((item as any).encryptedValue).toBeUndefined();
      expect((item as any).iv).toBeUndefined();
    });

    it('returns empty list when vault has no secrets', () => {
      const list = CredentialVaultService.listSecrets();
      expect(list).toEqual([]);
    });
  });

  // ─── 3. Secret Deletion ─────────────────────────────────────────────
  describe('3. Secret Deletion', () => {
    it('deletes an existing secret by ID and returns true', () => {
      const secret = CredentialVaultService.addSecret('del-me', 'to-be-deleted-val', 'api_key');
      expect(CredentialVaultService.listSecrets().length).toBe(1);

      const result = CredentialVaultService.deleteSecret(secret.id);
      expect(result).toBe(true);
      expect(CredentialVaultService.listSecrets().length).toBe(0);
    });

    it('returns false when deleting a non-existent secret ID', () => {
      const result = CredentialVaultService.deleteSecret('does-not-exist-123');
      expect(result).toBe(false);
    });
  });

  // ─── 4. Secret Injection & Access Control Policies ──────────────────
  describe('4. Secret Injection & Access Control Policies', () => {
    it('grants injection for auto_within_scope policy and returns raw secret', () => {
      CredentialVaultService.addSecret('auto-key', 'raw-secret-value-long', 'api_key', 'auto_within_scope');

      const result = CredentialVaultService.requestSecretInjection('auto-key', 'agent');
      expect(result.granted).toBe(true);
      expect(result.rawSecret).toBe('raw-secret-value-long');
    });

    it('denies injection for always_ask policy when caller is agent', () => {
      CredentialVaultService.addSecret('strict-key', 'super-secret-value1', 'api_key', 'always_ask');

      const result = CredentialVaultService.requestSecretInjection('strict-key', 'agent');
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('explicit owner authorization');
    });

    it('grants injection for always_ask policy when caller is user', () => {
      CredentialVaultService.addSecret('user-key', 'user-secret-value1x', 'api_key', 'always_ask');

      const result = CredentialVaultService.requestSecretInjection('user-key', 'user');
      expect(result.granted).toBe(true);
      expect(result.rawSecret).toBe('user-secret-value1x');
    });

    it('returns not-found error for non-existent secret name', () => {
      const result = CredentialVaultService.requestSecretInjection('ghost-key');
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('strips vault: prefix when looking up secrets', () => {
      CredentialVaultService.addSecret('prefixed', 'prefix-secret-long1', 'api_key', 'auto_within_scope');

      const result = CredentialVaultService.requestSecretInjection('vault:prefixed', 'agent');
      expect(result.granted).toBe(true);
      expect(result.rawSecret).toBe('prefix-secret-long1');
    });

    it('tracks session approval for ask_once_per_session policy', () => {
      CredentialVaultService.addSecret('session-key', 'session-secret-long', 'api_key', 'ask_once_per_session');

      // First call auto-approves for the session
      const r1 = CredentialVaultService.requestSecretInjection('session-key', 'agent');
      expect(r1.granted).toBe(true);

      // Second call should also succeed (session already approved)
      const r2 = CredentialVaultService.requestSecretInjection('session-key', 'agent');
      expect(r2.granted).toBe(true);
    });
  });

  // ─── 5. Secret Redaction in Output Text ──────────────────────────────
  describe('5. Secret Redaction in Output Text', () => {
    it('redacts known vault secrets from arbitrary text output', () => {
      CredentialVaultService.addSecret('redact-me', 'SUPER_SECRET_TOKEN_XYZ', 'api_key', 'auto_within_scope');

      const dirty = 'Response: key is SUPER_SECRET_TOKEN_XYZ, use it wisely.';
      const clean = CredentialVaultService.redactSecrets(dirty);

      expect(clean).not.toContain('SUPER_SECRET_TOKEN_XYZ');
      expect(clean).toContain('[REDACTED_SECRET:');
    });

    it('redacts common API key patterns (Gemini, OpenAI, GitHub)', () => {
      const text = 'Keys: AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX and sk-abcdefghijklmnopqrstuvwxyz123456 and ghp_abcdefghijklmnopqrstuvwxyz1234567890';

      const redacted = CredentialVaultService.redactSecrets(text);
      expect(redacted).toContain('[REDACTED_GEMINI_KEY]');
      expect(redacted).toContain('[REDACTED_OPENAI_KEY]');
      expect(redacted).toContain('[REDACTED_GITHUB_TOKEN]');
    });

    it('returns input unchanged when no secrets match', () => {
      const clean = 'This is a safe log message with no secrets.';
      expect(CredentialVaultService.redactSecrets(clean)).toBe(clean);
    });

    it('handles null/undefined/empty strings gracefully', () => {
      expect(CredentialVaultService.redactSecrets('')).toBe('');
      expect(CredentialVaultService.redactSecrets(null as any)).toBe(null);
      expect(CredentialVaultService.redactSecrets(undefined as any)).toBe(undefined);
    });
  });

  // ─── 6. Audit Log ───────────────────────────────────────────────────
  describe('6. Audit Log', () => {
    it('records audit entries for create, inject, and delete operations', () => {
      const secret = CredentialVaultService.addSecret('audit-test', 'audit-value-longstr', 'api_key', 'auto_within_scope');
      CredentialVaultService.requestSecretInjection('audit-test', 'agent', 'terminal');
      CredentialVaultService.deleteSecret(secret.id);

      const log = CredentialVaultService.getAuditLog();
      expect(log.length).toBe(3);

      // Log is reversed (newest first)
      expect(log[0].action).toBe('delete');
      expect(log[1].action).toBe('inject');
      expect(log[1].callerTool).toBe('terminal');
      expect(log[2].action).toBe('create');
    });

    it('returns audit log in reverse chronological order', () => {
      CredentialVaultService.addSecret('a1', 'aaaa-secret-first1', 'api_key');
      CredentialVaultService.addSecret('b2', 'bbbb-secret-second', 'api_key');

      const log = CredentialVaultService.getAuditLog();
      expect(log.length).toBe(2);
      expect(log[0].timestamp).toBeGreaterThanOrEqual(log[1].timestamp);
    });
  });
});
