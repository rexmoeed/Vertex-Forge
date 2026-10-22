/**
 * Security Audit Engine - Slim Orchestrator
 * Delegates to specialized sub-modules for:
 * - Secret redaction & masking
 * - Advisory database & version comparisons
 * - Dependency auditing & npm audit parsing
 * - AST and pattern-based static code analysis
 * - Remediation application and resolution verification
 * - Deliberately vulnerable test fixture generation
 */
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import {
  SecurityAuditReport,
  SecurityFinding,
  DependencyAuditItem,
  SecurityCategory,
  AuditVerificationResult,
} from '../types/securityAudit';
import { logger } from './logger';

// Re-export sub-modules for backward compatibility
export { SECRET_PATTERNS, redactSecrets } from './security/secretRedactor';
export type { SecretPattern } from './security/secretRedactor';
export { KNOWN_ADVISORIES, isVersionVulnerable } from './security/advisoryDatabase';
export type { KnownAdvisory } from './security/advisoryDatabase';
export { auditDependencies, processNpmAuditResults } from './security/dependencyAuditor';
export { analyzeFileContent } from './security/sourceCodeAnalyzer';
export { applyRemediation, verifyFindingResolution } from './security/remediationEngine';
export { createVulnerableFixture } from './security/fixtureGenerator';

import { auditDependencies } from './security/dependencyAuditor';
import { analyzeFileContent } from './security/sourceCodeAnalyzer';
import { applyRemediation as applyRemediationFn, verifyFindingResolution as verifyResolutionFn } from './security/remediationEngine';
import { createVulnerableFixture as createFixtureFn } from './security/fixtureGenerator';

export class SecurityAuditEngine {
  /**
   * Run full security and dependency audit on a target workspace directory.
   */
  static async auditWorkspace(workspaceDir: string = process.cwd()): Promise<SecurityAuditReport> {
    const startTime = Date.now();
    const findings: SecurityFinding[] = [];
    const dependencies: DependencyAuditItem[] = [];
    let scannedFilesCount = 0;
    let status: SecurityAuditReport['status'] = 'clean';
    let statusMessage = 'Audit completed successfully. No critical vulnerabilities found.';

    // Check directory existence
    if (!fs.existsSync(workspaceDir)) {
      return {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        projectPath: workspaceDir,
        status: 'scan_failed',
        statusMessage: `Directory not found or unreadable: ${workspaceDir}`,
        securityScore: 0,
        scannedFilesCount: 0,
        durationMs: Date.now() - startTime,
        counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
        categoryCounts: {} as Record<SecurityCategory, number>,
        findings: [],
        dependencies: [],
        auditorCapabilities: this.getCapabilities(),
        limitationsDisclaimer: this.getLimitationsDisclaimer(),
      };
    }

    // 1. DEPENDENCY AUDIT (Real npm audit + manifest inspection)
    try {
      const depResults = await this.auditDependencies(workspaceDir);
      dependencies.push(...depResults.items);
      findings.push(...depResults.findings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('[SecurityAuditor] Dependency audit warning:', { workspaceDir }, err);
      status = 'scan_partial';
      statusMessage = `Code scan completed, but dependency audit encountered limitation: ${msg}`;
    }

    // 2. STATIC SOURCE CODE AST & PATTERN ANALYSIS
    try {
      const codeScan = await this.auditSourceFiles(workspaceDir);
      scannedFilesCount = codeScan.scannedFilesCount;
      findings.push(...codeScan.findings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('[SecurityAuditor] Source audit error:', { workspaceDir }, err);
      status = 'scan_failed';
      statusMessage = `Failed during static source code analysis: ${msg}`;
    }

    // Compute counts and score
    const counts = {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length,
      total: findings.length,
    };

    const categoryCounts: Record<SecurityCategory, number> = {
      dependency: findings.filter(f => f.category === 'dependency').length,
      secret: findings.filter(f => f.category === 'secret').length,
      shell_injection: findings.filter(f => f.category === 'shell_injection').length,
      path_traversal: findings.filter(f => f.category === 'path_traversal').length,
      code_injection: findings.filter(f => f.category === 'code_injection').length,
      env_config: findings.filter(f => f.category === 'env_config').length,
      network_cors: findings.filter(f => f.category === 'network_cors').length,
      auth_rbac: findings.filter(f => f.category === 'auth_rbac').length,
      electron_ipc: findings.filter(f => f.category === 'electron_ipc').length,
      insecure_pattern: findings.filter(f => f.category === 'insecure_pattern').length,
    };

    // Overall Security Score calculation (0 to 100)
    let score = 100;
    score -= counts.critical * 25;
    score -= counts.high * 15;
    score -= counts.medium * 7;
    score -= counts.low * 2;
    const finalScore = Math.max(0, Math.min(100, score));

    if (findings.length > 0) {
      status = 'findings_detected';
      statusMessage = `Detected ${findings.length} security finding(s): ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium.`;
    } else if (status !== 'scan_partial') {
      status = 'clean';
      statusMessage = 'All automated security analyzers passed with zero detected vulnerabilities.';
    }

    return {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      projectPath: workspaceDir,
      status,
      statusMessage,
      securityScore: finalScore,
      scannedFilesCount,
      durationMs: Date.now() - startTime,
      counts,
      categoryCounts,
      findings,
      dependencies,
      auditorCapabilities: this.getCapabilities(),
      limitationsDisclaimer: this.getLimitationsDisclaimer(),
    };
  }

  /**
   * Audit project dependencies against npm registry and curated CVE database.
   */
  static async auditDependencies(projectDir: string): Promise<{
    items: DependencyAuditItem[];
    findings: SecurityFinding[];
  }> {
    return auditDependencies(projectDir);
  }

  /**
   * Walk source files and run static analysis on each.
   */
  static async auditSourceFiles(projectDir: string): Promise<{
    findings: SecurityFinding[];
    scannedFilesCount: number;
  }> {
    const findings: SecurityFinding[] = [];
    const filesToScan: string[] = [];
    const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.vitest']);
    const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.env', '.json']);

    async function walk(dir: string) {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!ignoreDirs.has(entry.name)) {
            await walk(path.join(dir, entry.name));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (allowedExtensions.has(ext) || entry.name.startsWith('.env')) {
            filesToScan.push(path.join(dir, entry.name));
          }
        }
      }
    }

    await walk(projectDir);
    for (const filePath of filesToScan) {
      const relativePath = path.relative(projectDir, filePath);
      const content = await fsPromises.readFile(filePath, 'utf-8');
      const fileFindings = analyzeFileContent(relativePath, content);
      findings.push(...fileFindings);
    }

    return { findings, scannedFilesCount: filesToScan.length };
  }

  /** Delegate to sub-module */
  static auditSingleFileContent(filePath: string, content: string): SecurityFinding[] {
    return analyzeFileContent(filePath, content);
  }

  /** Delegate to sub-module */
  static async applyRemediation(
    finding: SecurityFinding,
    workspaceDir: string = process.cwd()
  ): Promise<{ success: boolean; message: string; modifiedFiles: string[] }> {
    return applyRemediationFn(finding, workspaceDir);
  }

  /** Delegate to sub-module */
  static async verifyFindingResolution(
    finding: SecurityFinding,
    workspaceDir: string = process.cwd()
  ): Promise<AuditVerificationResult> {
    return verifyResolutionFn(finding, workspaceDir);
  }

  /** Delegate to sub-module */
  static async createVulnerableFixture(baseDir: string = process.cwd()): Promise<string> {
    return createFixtureFn(baseDir);
  }

  static getCapabilities(): string[] {
    return [
      'Real npm audit & Advisory Database Cross-Referencing',
      'High-Entropy & Multi-Vendor Committed Secret Detection',
      'Strict Secret Redaction (Zero Token Leakage in UI/Logs)',
      'Shell Injection & Dynamic Command Interpolation Detection',
      'Path Traversal & Unbounded Filesystem Access Detection',
      'Code Injection (eval, new Function, SQL Injection, XSS)',
      'Client-Side Environment Variable Leaks (VITE_ Exposure)',
      'Insecure CORS (Wildcards with Credentials) & TLS Bypass',
      'Missing Administrative Route Authorization & RBAC Checks',
      'Hardcoded Credential Authentication Detection',
      'Insecure Electron WebPreferences (nodeIntegration, contextIsolation)',
      'Risky Electron IPC Command Bridge Execution Analysis',
      'Automated Safe Remediation & Resolution Verification',
    ];
  }

  static getLimitationsDisclaimer(): string {
    return (
      'Vertex Forge Security Auditor provides static analysis, rule-based AST heuristics, and known vulnerability database matching. ' +
      'It cannot replace end-to-end dynamic penetration testing, runtime memory analysis, or manual architectural threat modeling. ' +
      'Clean audit reports reflect zero matches on configured rule analyzers and do not constitute a warranty of absolute security.'
    );
  }
}
