import { describe, it, expect } from 'vitest';
import { CspService } from '../cspService';

describe('CspService & Content Security Policy Enforcement', () => {
  it('generates standard default CSP header with strict isolation', () => {
    const header = CspService.buildPolicyHeader();

    expect(header).toContain("default-src 'self'");
    expect(header).toContain("object-src 'none'");
    expect(header).toContain("frame-ancestors 'none'");
    expect(header).toContain('img-src');
  });

  it('allows extending directives while preserving security defaults', () => {
    const custom = CspService.buildPolicyHeader({
      connectSrc: ["'self'", 'https://api.github.com', 'https://generativelanguage.googleapis.com'],
      upgradeInsecureRequests: true,
    });

    expect(custom).toContain('https://api.github.com');
    expect(custom).toContain('https://generativelanguage.googleapis.com');
    expect(custom).toContain('upgrade-insecure-requests');
  });

  it('validates policies and flags insecure configurations', () => {
    const insecure = "script-src * 'unsafe-eval'; style-src *";
    const report = CspService.validatePolicy(insecure);

    expect(report.isValid).toBe(false);
    expect(report.isStrict).toBe(false);
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.issues.some(i => i.includes('default-src'))).toBe(true);
    expect(report.issues.some(i => i.includes('unsafe-eval'))).toBe(true);
  });

  it('verifies strict compliance of default policy', () => {
    const validHeader = CspService.buildPolicyHeader();
    const report = CspService.validatePolicy(validHeader);

    expect(report.isValid).toBe(true);
    expect(report.isStrict).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
