import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { getScoreColor, getSeverityBadge, getCategoryIcon } from '../securityHelpers';
import { SecurityApprovalModal } from '../modals/SecurityApprovalModal';
import { SecurityCapabilitiesTab } from '../tabs/SecurityCapabilitiesTab';
import { SecurityAuditReport, SecurityFinding } from '../../../types/securityAudit';

describe('Security Auditor UI Modular Components', () => {
  it('correctly maps security score colors', () => {
    expect(getScoreColor(95)).toContain('text-emerald-400');
    expect(getScoreColor(75)).toContain('text-amber-400');
    expect(getScoreColor(50)).toContain('text-rose-400');
  });

  it('renders severity badges accurately', () => {
    const { container: crit } = render(getSeverityBadge('critical'));
    expect(crit.textContent).toBe('CRITICAL');

    const { container: high } = render(getSeverityBadge('high'));
    expect(high.textContent).toBe('HIGH');
  });

  it('renders category icons for security classifications', () => {
    const { container } = render(getCategoryIcon('secret'));
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders approval modal for breaking changes', () => {
    const mockFinding: SecurityFinding = {
      id: 'sec-1',
      ruleId: 'hardcoded-secret',
      category: 'secret',
      severity: 'critical',
      title: 'Hardcoded API Token Found',
      filePath: 'src/config.ts',
      lineStart: 10,
      evidence: 'const KEY = "sk_live_123456789";',
      explanation: 'Secret detected in code',
      attackVector: 'Exposed credentials',
      confidence: 'high',
      confidenceReason: 'Matches entropy profile',
      limitations: 'Static match',
      recommendedFix: 'Use process.env',
      remediation: {
        title: 'Rotate and extract key to environment',
        automated: true,
        requiresApproval: true,
        isBreaking: true,
        breakingRiskDetails: 'Token rotation required',
      },
      resolved: false,
    };

    const onApprove = vi.fn();
    const onCancel = vi.fn();

    render(
      <SecurityApprovalModal
        finding={mockFinding}
        onCancel={onCancel}
        onApprove={onApprove}
      />
    );

    expect(screen.getByText(/Approval Required/i)).toBeDefined();
    expect(screen.getByText('Hardcoded API Token Found')).toBeDefined();
  });

  it('renders capabilities tab with auditor engine list', () => {
    const mockReport: SecurityAuditReport = {
      status: 'clean',
      projectPath: '/test',
      scannedFilesCount: 42,
      durationMs: 120,
      securityScore: 98,
      counts: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0 },
      categoryCounts: {
        dependency: 0,
        secret: 0,
        shell_injection: 0,
        path_traversal: 0,
        code_injection: 0,
        env_config: 0,
        network_cors: 0,
        auth_rbac: 0,
        electron_ipc: 0,
      },
      findings: [],
      dependencies: [],
      auditorCapabilities: ['Static AST Scanner', 'Dependency Vulnerability Audit'],
      limitationsDisclaimer: 'Offline local scanning engine',
    };

    render(<SecurityCapabilitiesTab report={mockReport} />);
    expect(screen.getByText('Static AST Scanner')).toBeDefined();
    expect(screen.getByText('Dependency Vulnerability Audit')).toBeDefined();
  });
});
