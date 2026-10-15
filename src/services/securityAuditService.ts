import {
  SecurityAuditReport,
  SecurityFinding,
  AuditVerificationResult,
  SecurityCategory,
} from '../types/securityAudit';

export class SecurityAuditService {
  /**
   * Run security audit via server API.
   */
  static async runAudit(projectPath?: string): Promise<SecurityAuditReport> {
    try {
      const response = await fetch('/api/security/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      const errData = await response.json().catch(() => ({}));
      console.warn('[SecurityAuditService] Backend audit API error:', errData);
    } catch (err) {
      console.warn('[SecurityAuditService] Backend audit API unavailable:', err);
    }

    return {
      id: `audit-${Date.now()}`,
      projectPath: projectPath || '.',
      timestamp: new Date().toISOString(),
      securityScore: 0,
      status: 'scan_failed',
      statusMessage: 'Security audit service unavailable or network error. Please ensure the backend server is running.',
      findings: [],
      dependencies: [],
      scannedFilesCount: 0,
      durationMs: 0,
      counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
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
        insecure_pattern: 0,
      },
      auditorCapabilities: [],
      limitationsDisclaimer: 'Audit failed to run. Check server connection.',
    };
  }

  /**
   * Apply remediation for a specific finding.
   */
  static async applyRemediation(
    finding: SecurityFinding,
    workspaceDir?: string
  ): Promise<{ success: boolean; message: string; modifiedFiles: string[] }> {
    try {
      const response = await fetch('/api/security/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding, workspaceDir }),
      });

      if (response.ok) {
        return await response.json();
      }
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: err.details || err.error || 'Remediation request failed',
        modifiedFiles: [],
      };
    } catch (err: any) {
      console.warn('[SecurityAuditService] Backend remediation API error:', err);
      return {
        success: false,
        message: `Network error applying remediation: ${err?.message || String(err)}`,
        modifiedFiles: [],
      };
    }
  }

  /**
   * Verify that a finding has been resolved.
   */
  static async verifyResolution(
    finding: SecurityFinding,
    workspaceDir?: string
  ): Promise<AuditVerificationResult> {
    try {
      const response = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding, workspaceDir }),
      });

      if (response.ok) {
        return await response.json();
      }
      const err = await response.json().catch(() => ({}));
      return {
        findingId: finding.id,
        resolved: false,
        message: err.details || err.error || 'Verification request failed',
        verifiedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('[SecurityAuditService] Backend verification API error:', err);
      return {
        findingId: finding.id,
        resolved: false,
        message: `Network error verifying finding: ${err?.message || String(err)}`,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate or reset the deliberately vulnerable test fixture.
   */
  static async createVulnerableFixture(): Promise<{ success: boolean; fixturePath: string }> {
    try {
      const response = await fetch('/api/security/fixture/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[SecurityAuditService] Fixture API fallback error:', err);
    }

    return {
      success: false,
      fixturePath: '',
    };
  }

  /**
   * Export audit report to JSON or formatted Markdown.
   */
  static exportReport(report: SecurityAuditReport, format: 'json' | 'markdown' = 'markdown'): string {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    const dateStr = new Date(report.timestamp).toLocaleString();
    let md = `# Vertex Forge Security & Dependency Audit Report\n\n`;
    md += `**Timestamp:** ${dateStr}  \n`;
    md += `**Project Path:** \`${report.projectPath}\`  \n`;
    md += `**Security Health Score:** **${report.securityScore} / 100**  \n`;
    md += `**Status:** ${report.status.toUpperCase()} (${report.statusMessage})  \n`;
    md += `**Scanned Files:** ${report.scannedFilesCount} | **Scan Duration:** ${report.durationMs}ms  \n\n`;

    md += `### Summary Metrics\n\n`;
    md += `- **Critical:** ${report.counts.critical}\n`;
    md += `- **High:** ${report.counts.high}\n`;
    md += `- **Medium:** ${report.counts.medium}\n`;
    md += `- **Low:** ${report.counts.low}\n`;
    md += `- **Total Findings:** ${report.counts.total}\n\n`;

    if (report.dependencies.length > 0) {
      md += `### Vulnerable Dependencies (${report.dependencies.length})\n\n`;
      md += `| Package | Severity | Current | Fixed | CVE / Advisory | Breaking Risk |\n`;
      md += `|---|---|---|---|---|---|\n`;
      for (const dep of report.dependencies) {
        md += `| \`${dep.packageName}\` | **${dep.severity.toUpperCase()}** | ${dep.currentVersion} | ${dep.fixedVersion} | [Link](${dep.advisoryUrl}) | ${dep.isBreaking ? '⚠️ Major (Breaking)' : '✅ Patch/Minor'} |\n`;
      }
      md += `\n`;
    }

    if (report.findings.length > 0) {
      md += `### Detailed Findings (${report.findings.length})\n\n`;
      for (const f of report.findings) {
        md += `#### [${f.severity.toUpperCase()}] ${f.title}\n\n`;
        md += `- **Rule:** \`${f.ruleId}\` (${f.category})\n`;
        md += `- **Location:** \`${f.filePath}:${f.lineStart}\`\n`;
        md += `- **Evidence (Redacted):** \`${f.evidence}\`\n`;
        md += `- **Explanation:** ${f.explanation}\n`;
        md += `- **Attack Vector:** ${f.attackVector}\n`;
        md += `- **Recommended Fix:** ${f.recommendedFix}\n`;
        md += `- **Confidence:** ${f.confidence.toUpperCase()} - ${f.confidenceReason}\n`;
        md += `- **Limitations:** ${f.limitations}\n\n`;
      }
    }

    md += `---\n\n`;
    md += `*Disclaimer: ${report.limitationsDisclaimer}*\n`;
    return md;
  }
}
