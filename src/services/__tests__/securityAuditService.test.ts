import { describe, it, expect, vi } from 'vitest';
import { SecurityAuditService } from '../securityAuditService';
import { SecurityAuditReport, SecurityFinding, DependencyAuditItem } from '../../types/securityAudit';

describe('SecurityAuditService', () => {
  const mockFinding: SecurityFinding = {
    id: 'finding-1',
    ruleId: 'SEC001',
    title: 'Hardcoded API Key',
    severity: 'medium',
    category: 'secret',
    filePath: 'src/config.ts',
    lineStart: 10,
    lineEnd: 10,
    evidence: 'sk-ant-api03-***',
    explanation: 'Sensitive API key found in source code',
    attackVector: 'Exfiltration through git commit history',
    recommendedFix: 'Use environment variables via process.env',
    confidence: 'high',
    confidenceReason: 'Matches entropy profile',
    limitations: 'Static analysis only',
    remediation: {
      type: 'redact_secret',
      title: 'Move secret to environment file',
      description: 'Replace hardcoded secret with process.env.API_KEY',
      requiresApproval: false,
    },
  };

  const mockDep: DependencyAuditItem = {
    packageName: 'axios',
    currentVersion: '0.21.1',
    fixedVersion: '0.21.2',
    severity: 'high',
    advisoryTitle: 'SSRF in axios',
    advisoryUrl: 'https://cve.mitre.org',
    isDirect: true,
    dependencyPath: ['axios'],
    isBreaking: false,
    breakingExplanation: 'Minor patch release',
    recommendedAction: 'Upgrade to 0.21.2',
    fixAvailable: true,
  };

  const mockReport: SecurityAuditReport = {
    id: 'audit-123',
    timestamp: '2026-10-22T10:00:00.000Z',
    projectPath: '/app',
    status: 'findings_detected',
    statusMessage: 'Workspace findings detected',
    securityScore: 95,
    counts: {
      critical: 0,
      high: 0,
      medium: 1,
      low: 0,
      info: 0,
      total: 1,
    },
    categoryCounts: {
      dependency: 1,
      secret: 1,
      shell_injection: 0,
      path_traversal: 0,
      code_injection: 0,
      env_config: 0,
      network_cors: 0,
      auth_rbac: 0,
      electron_ipc: 0,
      insecure_pattern: 0,
    },
    findings: [mockFinding],
    dependencies: [mockDep],
    scannedFilesCount: 25,
    durationMs: 140,
    auditorCapabilities: ['ast_analysis', 'dependency_vulnerability_scan'],
    limitationsDisclaimer: 'Automated audit does not replace human penetration testing.',
  };

  it('exports report in JSON format', () => {
    const json = SecurityAuditService.exportReport(mockReport, 'json');
    expect(json).toBeDefined();
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe('audit-123');
    expect(parsed.securityScore).toBe(95);
  });

  it('exports report in Markdown format with metrics and tables', () => {
    const md = SecurityAuditService.exportReport(mockReport, 'markdown');
    expect(md).toContain('# Vertex Forge Security & Dependency Audit Report');
    expect(md).toContain('95 / 100');
    expect(md).toContain('axios');
    expect(md).toContain('Hardcoded API Key');
    expect(md).toContain('Automated audit does not replace human penetration testing.');
  });

  it('handles runAudit fallback safely when network/server is unavailable', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    try {
      const report = await SecurityAuditService.runAudit();
      expect(report).toBeDefined();
      expect(report.status).toBe('scan_failed');
      expect(report.statusMessage).toContain('Security audit service unavailable');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('handles successful API response in runAudit', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    } as any);

    try {
      const report = await SecurityAuditService.runAudit('/custom/path');
      expect(report).toEqual(mockReport);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('handles applyRemediation API calls', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Patch applied', modifiedFiles: ['src/config.ts'] }),
    } as any);

    try {
      const result = await SecurityAuditService.applyRemediation(mockFinding, '/app');
      expect(result.success).toBe(true);
      expect(result.modifiedFiles).toContain('src/config.ts');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
