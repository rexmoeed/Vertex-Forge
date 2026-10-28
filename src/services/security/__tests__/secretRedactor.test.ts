import { describe, it, expect } from 'vitest';
import { redactSecrets, SECRET_PATTERNS } from '../secretRedactor';

describe('Security: Secret Redactor Engine', () => {
  it('returns empty string if input is empty or null', () => {
    expect(redactSecrets('')).toBe('');
    expect(redactSecrets(null as any)).toBe('');
  });

  it('masks Google Gemini API Keys with preservation prefix', () => {
    const raw = 'Configured key AIzaSyD4mP_exampleKey1234567890abcdef123 for agent';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('exampleKey1234567890abcdef123');
    expect(redacted).toContain('AIzaSy***[REDACTED]***');
  });

  it('masks OpenAI Secret Keys', () => {
    const raw = 'OPENAI_API_KEY=sk-abcdef1234567890abcdef123456789012';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('abcdef1234567890abcdef123456789012');
    expect(redacted).toContain('sk-abcd***[REDACTED]***');
  });

  it('masks Anthropic API Keys', () => {
    const raw = 'ANTHROPIC_KEY=sk-ant-api03-abcdef1234567890abcdef1234567890';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('api03-abcdef1234567890abcdef1234567890');
    expect(redacted).toContain('sk-ant-***[REDACTED]***');
  });

  it('masks AWS Access Key IDs', () => {
    const raw = 'aws_access_key_id = AKIAIOSFODNN7EXAMPLE';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('IOSFODNN7EXAMPLE');
    expect(redacted).toContain('AKIA***[REDACTED]***');
  });

  it('masks Database connection URIs with embedded passwords', () => {
    const raw = 'DATABASE_URL="postgres://admin:superSecretP@ss123@db.example.com:5432/production"';
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('superSecretP@ss123');
    expect(redacted).toContain('[REDACTED_PASSWORD]');
  });

  it('masks full RSA / EC Private Key blocks', () => {
    const raw = `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y1+examplePrivateData...
...morePrivateCertificateData==
-----END RSA PRIVATE KEY-----`;
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain('examplePrivateData');
    expect(redacted).toContain('[REDACTED PRIVATE KEY BLOCK]');
  });

  it('leaves safe code without sensitive credentials untouched', () => {
    const cleanCode = `
export function calculateSum(a: number, b: number): number {
  return a + b;
}`;
    expect(redactSecrets(cleanCode)).toBe(cleanCode);
  });
});
