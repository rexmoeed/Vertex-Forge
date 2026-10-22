import { describe, it, expect } from 'vitest';
import { processNpmAuditResults, auditDependencies } from '../dependencyAuditor';
import { DependencyAuditItem, SecurityFinding } from '../../../types/securityAudit';

describe('DependencyAuditor Engine', () => {
  it('processes npm audit vulnerability objects into findings and audit items', () => {
    const items: DependencyAuditItem[] = [];
    const findings: SecurityFinding[] = [];

    const mockAuditReport = {
      vulnerabilities: {
        lodash: {
          name: 'lodash',
          severity: 'high',
          isDirect: true,
          range: '<4.17.21',
          nodes: ['lodash'],
          fixAvailable: {
            name: 'lodash',
            version: '4.17.21',
            isSemVerMajor: false,
          },
          via: [
            {
              title: 'Prototype Pollution in lodash',
              url: 'https://github.com/advisories/GHSA-p6mc-m468-83gw',
              cwe: ['CWE-1321'],
            },
          ],
        },
      },
    };

    const allDeclaredDeps = { lodash: '^4.17.15' };

    processNpmAuditResults(mockAuditReport, allDeclaredDeps, items, findings);

    expect(items.length).toBe(1);
    expect(items[0].packageName).toBe('lodash');
    expect(items[0].severity).toBe('high');
    expect(items[0].fixedVersion).toBe('4.17.21');
    expect(items[0].isBreaking).toBe(false);

    expect(findings.length).toBe(1);
    expect(findings[0].category).toBe('dependency');
    expect(findings[0].title).toContain('lodash');
    expect(findings[0].remediation.type).toBe('dependency_upgrade');
  });

  it('handles breaking major upgrades with approval requirement', () => {
    const items: DependencyAuditItem[] = [];
    const findings: SecurityFinding[] = [];

    const mockAuditReport = {
      vulnerabilities: {
        axios: {
          name: 'axios',
          severity: 'critical',
          isDirect: true,
          range: '<1.0.0',
          fixAvailable: {
            name: 'axios',
            version: '1.2.0',
            isSemVerMajor: true,
          },
          via: [{ title: 'SSRF Vulnerability in axios' }],
        },
      },
    };

    processNpmAuditResults(mockAuditReport, { axios: '^0.21.1' }, items, findings);

    expect(items[0].isBreaking).toBe(true);
    expect(findings[0].remediation.requiresApproval).toBe(true);
  });

  it('returns empty collections when project directory lacks package.json', async () => {
    const result = await auditDependencies('/non-existent-directory-xyz');
    expect(result.items).toEqual([]);
    expect(result.findings).toEqual([]);
  });
});
