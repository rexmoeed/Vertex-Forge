/**
 * Dependency Auditor Engine
 * Audits project dependencies against npm advisory registry and curated CVE catalog.
 */
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import {
  DependencyAuditItem,
  SecurityFinding,
  SecuritySeverity,
} from '../../types/securityAudit';
import { logger } from '../logger';
import { KNOWN_ADVISORIES, isVersionVulnerable } from './advisoryDatabase';

async function executeCommand(cmd: string, cwd: string, timeout = 30000): Promise<{ stdout: string; stderr: string }> {
  if (typeof window !== 'undefined') {
    throw new Error('Command execution is only supported on server runtime');
  }
  const cp = await import(/* @vite-ignore */ 'child_process');
  const u = await import(/* @vite-ignore */ 'util');
  const execAsyncFn = u.promisify(cp.exec);
  return execAsyncFn(cmd, { cwd, timeout });
}

export function processNpmAuditResults(
  auditReport: Record<string, unknown>,
  allDeclaredDeps: Record<string, string>,
  items: DependencyAuditItem[],
  findings: SecurityFinding[]
): void {
  const vulnerabilities = auditReport.vulnerabilities as Record<string, Record<string, unknown>> | undefined;
  if (!vulnerabilities) return;
  for (const [pkgName, vulnData] of Object.entries(vulnerabilities)) {
    const via = Array.isArray(vulnData.via) && vulnData.via.length > 0 && typeof vulnData.via[0] === 'object'
      ? vulnData.via[0] as Record<string, unknown>
      : null;
    const advisoryTitle = (via?.title as string) || `${pkgName} vulnerability`;
    const advisoryUrl = (via?.url as string) || `https://www.npmjs.com/package/${pkgName}`;
    const rawSeverity = ((vulnData.severity as string) || 'medium').toLowerCase();
    const severity: SecuritySeverity = rawSeverity === 'moderate' ? 'medium' : rawSeverity as SecuritySeverity;
    const fixAvail = vulnData.fixAvailable;
    const fixedVer = fixAvail === true ? 'latest' : ((fixAvail as Record<string, unknown>)?.version as string || 'patched');
    const isDirect = !!vulnData.isDirect;
    const currentVer = allDeclaredDeps[pkgName] || (vulnData.range as string) || 'installed';
    const isBreaking = (fixAvail as Record<string, unknown>)?.isSemVerMajor as boolean || false;
    const item: DependencyAuditItem = {
      packageName: pkgName,
      severity,
      currentVersion: currentVer,
      fixedVersion: fixedVer,
      advisoryTitle,
      advisoryUrl,
      cve: (via?.cwe as string[])?.[0] || 'Advisory',
      isDirect,
      dependencyPath: (vulnData.nodes as string[]) || [pkgName],
      isBreaking,
      breakingExplanation: isBreaking
        ? `Major version upgrade for ${pkgName} introduces breaking API modifications.`
        : `Safe backwards-compatible upgrade for ${pkgName}.`,
      recommendedAction: `npm install ${pkgName}@${fixedVer}`,
      fixAvailable: !!fixAvail,
    };
    items.push(item);
    findings.push({
      id: `dep-${pkgName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ruleId: 'SEC-DEP-001',
      category: 'dependency',
      severity: item.severity,
      title: `Vulnerable Dependency: ${pkgName} (${item.severity.toUpperCase()})`,
      filePath: 'package.json',
      lineStart: 1,
      lineEnd: 1,
      evidence: `"${pkgName}": "${currentVer}"`,
      explanation: advisoryTitle,
      attackVector: `Security advisory: ${advisoryUrl}`,
      recommendedFix: `Update ${pkgName} to ${fixedVer}`,
      confidence: 'high',
      confidenceReason: 'npm audit advisory registry output.',
      limitations: 'Lockfile scan accurately identifies transitive and direct vulnerability paths.',
      advisoryUrl,
      remediation: {
        type: 'dependency_upgrade',
        title: `Upgrade ${pkgName} to ${fixedVer}`,
        description: item.breakingExplanation,
        packageName: pkgName,
        targetVersion: fixedVer,
        isBreaking,
        breakingRiskDetails: item.breakingExplanation,
        requiresApproval: isBreaking,
      },
    });
  }
}

export async function auditDependencies(projectDir: string): Promise<{
  items: DependencyAuditItem[];
  findings: SecurityFinding[];
}> {
  const items: DependencyAuditItem[] = [];
  const findings: SecurityFinding[] = [];

  const pkgJsonPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    return { items, findings };
  }

  const pkgJson = JSON.parse(await fsPromises.readFile(pkgJsonPath, 'utf-8'));
  const allDeclaredDeps: Record<string, string> = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {}),
  };

  // Try npm audit first
  if (fs.existsSync(path.join(projectDir, 'package-lock.json'))) {
    try {
      const result = await executeCommand('npm audit --json', projectDir, 30000);
      const auditReport = JSON.parse(result.stdout);
      if (auditReport.vulnerabilities) {
        processNpmAuditResults(auditReport, allDeclaredDeps, items, findings);
      }
    } catch (err: unknown) {
      const errObj = err as { stdout?: string };
      if (errObj.stdout) {
        try {
          const auditReport = JSON.parse(errObj.stdout);
          if (auditReport.vulnerabilities) {
            processNpmAuditResults(auditReport, allDeclaredDeps, items, findings);
          }
        } catch {
          logger.warn('Failed to parse npm audit fallback output', { projectDir });
        }
      }
    }
  }

  // Fallback: cross-reference against curated advisory catalog
  for (const [depName, declaredVer] of Object.entries(allDeclaredDeps)) {
    if (items.some(it => it.packageName === depName)) continue;
    const advisory = KNOWN_ADVISORIES.find(a => a.package === depName);
    if (advisory && isVersionVulnerable(declaredVer, advisory.vulnerableRange)) {
      const item: DependencyAuditItem = {
        packageName: depName,
        severity: advisory.severity,
        currentVersion: declaredVer,
        fixedVersion: advisory.fixedVersion,
        advisoryTitle: advisory.title,
        advisoryUrl: advisory.advisoryUrl,
        cve: advisory.cve,
        isDirect: true,
        dependencyPath: [depName],
        isBreaking: advisory.isBreaking,
        breakingExplanation: advisory.breakingExplanation,
        recommendedAction: `npm install ${depName}@${advisory.fixedVersion}`,
        fixAvailable: true,
      };
      items.push(item);
      findings.push({
        id: `dep-${depName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ruleId: 'SEC-DEP-002',
        category: 'dependency',
        severity: advisory.severity,
        title: `Vulnerable Dependency: ${depName} (${advisory.severity.toUpperCase()})`,
        filePath: 'package.json',
        lineStart: 1,
        lineEnd: 1,
        evidence: `"${depName}": "${declaredVer}"`,
        explanation: advisory.title,
        attackVector: advisory.cve ? `${advisory.cve} - ${advisory.advisoryUrl}` : advisory.advisoryUrl,
        recommendedFix: `Upgrade ${depName} to ${advisory.fixedVersion}`,
        confidence: 'high',
        confidenceReason: 'Exact version match in curated Security Advisory Knowledge Base.',
        limitations: 'Manifest declares semver ranges; resolved lockfile determines actual deployed version.',
        cve: advisory.cve,
        advisoryUrl: advisory.advisoryUrl,
        remediation: {
          type: 'dependency_upgrade',
          title: `Upgrade ${depName} to ${advisory.fixedVersion}`,
          description: advisory.breakingExplanation,
          packageName: depName,
          targetVersion: advisory.fixedVersion,
          isBreaking: advisory.isBreaking,
          breakingRiskDetails: advisory.breakingExplanation,
          requiresApproval: advisory.isBreaking,
        },
      });
    }
  }

  return { items, findings };
}
