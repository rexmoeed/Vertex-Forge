import { describe, it, expect } from 'vitest';
import { SecretLeakDetector } from '../secretLeakDetector';

describe('SecretLeakDetector & Credential Guard', () => {
  it('detects GitHub personal access tokens', () => {
    const code = 'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz12";';
    const hits = SecretLeakDetector.scan(code);

    expect(hits.length).toBe(1);
    expect(hits[0].type).toBe('github_token');
    expect(hits[0].line).toBe(1);
    expect(hits[0].matchedPattern).toContain('***');
  });

  it('detects Google AI API keys (AIzaSy...)', () => {
    const text = 'GEMINI_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw';
    const hits = SecretLeakDetector.scan(text);

    expect(hits.length).toBe(1);
    expect(hits[0].type).toBe('google_ai_key');
  });

  it('detects RSA private key headers', () => {
    const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----';
    const hits = SecretLeakDetector.scan(pem);

    expect(hits.length).toBe(1);
    expect(hits[0].type).toBe('rsa_private_key');
  });

  it('redacts all detected secrets cleanly', () => {
    const text = 'Deploying with ghp_1234567890abcdefghijklmnopqrstuvwxyz12 and AIzaSyD1234567890abcdefghijklmnopqrstuvw';
    const sanitized = SecretLeakDetector.redact(text);

    expect(sanitized).not.toContain('ghp_');
    expect(sanitized).not.toContain('AIzaSy');
    expect(sanitized).toContain('[REDACTED_SECRET]');
  });

  it('returns empty array when content contains zero secrets', () => {
    const clean = 'export const greeting = "Hello world";';
    const hits = SecretLeakDetector.scan(clean);

    expect(hits).toEqual([]);
  });
});
