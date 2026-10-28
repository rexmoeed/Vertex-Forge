import { describe, it, expect } from 'vitest';
import { SecretScannerService } from '../../secretScannerService';

describe('Security: SecretScannerService & Entropy Detection', () => {
  it('returns empty array when scanning empty text or null', () => {
    expect(SecretScannerService.scanText('', 'test.ts')).toEqual([]);
    expect(SecretScannerService.scanText(null as any, 'test.ts')).toEqual([]);
  });

  it('detects committed Google Gemini API keys in source files', () => {
    const code = 'const apiKey = "AIzaSyD4mP-exampleKey1234567890abcdef";';
    const findings = SecretScannerService.scanText(code, 'src/config.ts');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('Google Gemini API Key');
    expect(findings[0].file).toBe('src/config.ts');
    expect(findings[0].line).toBe(1);
    expect(findings[0].matchSnippet).toContain('••••');
  });

  it('detects OpenAI secret tokens', () => {
    const code = `
// Config
const client = new OpenAI({ apiKey: "sk-12345678901234567890123456789012" });
`;
    const findings = SecretScannerService.scanText(code, 'api.ts');
    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('OpenAI Secret Key');
    expect(findings[0].line).toBe(3);
  });

  it('detects embedded database credentials with connection string pattern', () => {
    const code = 'const uri = "mongodb+srv://root:supersecret123@cluster0.abc.mongodb.net/prod";';
    const findings = SecretScannerService.scanText(code, 'db.ts');
    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('Database Connection String');
  });

  it('calculates Shannon entropy correctly for random vs uniform strings', () => {
    const zeroEntropy = SecretScannerService.calculateShannonEntropy('aaaaa');
    expect(zeroEntropy).toBe(0);

    const highEntropy = SecretScannerService.calculateShannonEntropy('8f#kL!9$qP@zW1&m');
    expect(highEntropy).toBeGreaterThan(3.5);
  });

  it('flags 0 findings on clean application code', () => {
    const safeCode = `
import React from 'react';

export const Welcome = () => <h1>Welcome to Vertex Forge</h1>;
`;
    const findings = SecretScannerService.scanText(safeCode, 'Welcome.tsx');
    expect(findings.length).toBe(0);
  });
});
