/**
 * Security Remediation Engine
 * Automated safe remediation application and post-remediation verification.
 */
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { SecurityFinding, AuditVerificationResult } from '../../types/securityAudit';
import { auditDependencies } from './dependencyAuditor';
import { analyzeFileContent } from './sourceCodeAnalyzer';

async function executeCommand(cmd: string, cwd: string, timeout = 30000): Promise<{ stdout: string; stderr: string }> {
  if (typeof window !== 'undefined') {
    throw new Error('Command execution is only supported on server runtime');
  }
  const cp = await import(/* @vite-ignore */ 'child_process');
  const u = await import(/* @vite-ignore */ 'util');
  const execAsyncFn = u.promisify(cp.exec);
  return execAsyncFn(cmd, { cwd, timeout });
}

export async function applyRemediation(
    finding: SecurityFinding,
    workspaceDir: string = process.cwd()
  ): Promise<{ success: boolean; message: string; modifiedFiles: string[] }> {
    const modifiedFiles: string[] = [];

    // 1. Dependency Upgrade
    if (finding.category === 'dependency' && finding.remediation.type === 'dependency_upgrade') {
      const { packageName, targetVersion } = finding.remediation;
      if (!packageName || !targetVersion) {
        return { success: false, message: 'Missing package name or target version.', modifiedFiles: [] };
      }

      try {
        const cmd = `npm install ${packageName}@${targetVersion} --legacy-peer-deps`;
        await executeCommand(cmd, workspaceDir, 30000);
        modifiedFiles.push('package.json');
        return {
          success: true,
          message: `Successfully upgraded ${packageName} to version ${targetVersion}.`,
          modifiedFiles,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Failed to install ${packageName}@${targetVersion}: ${err.message}`,
          modifiedFiles: [],
        };
      }
    }

    // 2. Secret Redaction / Extraction to .env
    if (finding.category === 'secret' && finding.remediation.type === 'redact_secret') {
      const targetPath = path.join(workspaceDir, finding.filePath);
      if (!fs.existsSync(targetPath)) {
        return { success: false, message: `Target file not found: ${finding.filePath}`, modifiedFiles: [] };
      }

      const fileContent = await fsPromises.readFile(targetPath, 'utf-8');
      const lines = fileContent.split('\n');
      const targetLineIdx = finding.lineStart - 1;

      if (targetLineIdx >= 0 && targetLineIdx < lines.length) {
        const line = lines[targetLineIdx];

        // Replace literal key with process.env
        let replacedLine = line;
        let envKey = 'API_KEY';

        if (line.includes('AKIA')) {
          envKey = 'AWS_ACCESS_KEY_ID';
          replacedLine = line.replace(/["'](?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}["']/, `process.env.${envKey}`);
        } else if (line.includes('sk-')) {
          envKey = 'OPENAI_API_KEY';
          replacedLine = line.replace(/["']sk-[A-Za-z0-9_\-]+["']/, `process.env.${envKey}`);
        } else if (line.includes('AIza')) {
          envKey = 'GEMINI_API_KEY';
          replacedLine = line.replace(/["']AIza[0-9A-Za-z\-_]{35}["']/, `process.env.${envKey}`);
        } else if (line.includes('ghp_')) {
          envKey = 'GITHUB_TOKEN';
          replacedLine = line.replace(/["']ghp_[A-Za-z0-9]{36}["']/, `process.env.${envKey}`);
        } else {
          envKey = 'SECRET_TOKEN';
          replacedLine = line.replace(/["'][^"']{12,}["']/, `process.env.${envKey}`);
        }

        lines[targetLineIdx] = replacedLine;
        await fsPromises.writeFile(targetPath, lines.join('\n'), 'utf-8');
        modifiedFiles.push(finding.filePath);

        // Update .env.example with placeholder
        const envExamplePath = path.join(workspaceDir, '.env.example');
        const exampleLine = `${envKey}=your_${envKey.toLowerCase()}_here\n`;
        if (fs.existsSync(envExamplePath)) {
          const exContent = await fsPromises.readFile(envExamplePath, 'utf-8');
          if (!exContent.includes(envKey)) {
            await fsPromises.appendFile(envExamplePath, exampleLine);
          }
        } else {
          await fsPromises.writeFile(envExamplePath, exampleLine);
        }
        modifiedFiles.push('.env.example');

        return {
          success: true,
          message: `Replaced hardcoded secret on line ${finding.lineStart} with process.env.${envKey} and added placeholder to .env.example.`,
          modifiedFiles,
        };
      }
    }

    // 3. Automated Code Patches for specific known rules
    if (finding.remediation.type === 'code_patch') {
      const targetPath = path.join(workspaceDir, finding.filePath);
      if (!fs.existsSync(targetPath)) {
        return { success: false, message: `Target file not found: ${finding.filePath}`, modifiedFiles: [] };
      }

      const fileContent = await fsPromises.readFile(targetPath, 'utf-8');
      const lines = fileContent.split('\n');
      const targetLineIdx = finding.lineStart - 1;

      if (targetLineIdx >= 0 && targetLineIdx < lines.length) {
        const line = lines[targetLineIdx];
        let newLine = line;

        // Rule: Electron nodeIntegration
        if (finding.ruleId === 'SEC-ELEC-001') {
          newLine = line.replace(/nodeIntegration\s*:\s*true/, 'nodeIntegration: false, contextIsolation: true');
        }
        // Rule: Electron contextIsolation
        else if (finding.ruleId === 'SEC-ELEC-002') {
          newLine = line.replace(/contextIsolation\s*:\s*false/, 'contextIsolation: true');
        }
        // Rule: Electron webSecurity
        else if (finding.ruleId === 'SEC-ELEC-003') {
          newLine = line.replace(/webSecurity\s*:\s*false/, 'webSecurity: true');
        }
        // Rule: TLS verification
        else if (finding.ruleId === 'SEC-NET-001') {
          newLine = line.replace(/rejectUnauthorized\s*:\s*false/, 'rejectUnauthorized: true');
        }
        // Rule: CORS wildcard with credentials
        else if (finding.ruleId === 'SEC-CORS-001') {
          newLine = line.replace(/origin\s*:\s*['"]\*['"]/, "origin: ['https://app.example.com']");
        }
        // Rule: dangerouslySetInnerHTML
        else if (finding.ruleId === 'SEC-XSS-001') {
          newLine = line.replace(/__html\s*:\s*([^}]+)/, '__html: DOMPurify.sanitize($1)');
        }

        if (newLine !== line) {
          lines[targetLineIdx] = newLine;
          await fsPromises.writeFile(targetPath, lines.join('\n'), 'utf-8');
          modifiedFiles.push(finding.filePath);
          return {
            success: true,
            message: `Applied secure code patch on line ${finding.lineStart} of ${finding.filePath}.`,
            modifiedFiles,
          };
        }
      }
    }

    return {
      success: false,
      message: `Manual remediation recommended for ${finding.title}. Please review the recommended fix.`,
      modifiedFiles: [],
    };
  }

  /**
   * Verify that a specific finding is truly resolved after remediation.
   */
  export async function verifyFindingResolution(
    finding: SecurityFinding,
    workspaceDir: string = process.cwd()
  ): Promise<AuditVerificationResult> {
    const verifiedAt = new Date().toISOString();

    // 1. Dependency verification
    if (finding.category === 'dependency') {
      const depCheck = await auditDependencies(workspaceDir);
      const stillVulnerable = depCheck.findings.some(f => f.title === finding.title || f.evidence === finding.evidence);
      return {
        findingId: finding.id,
        resolved: !stillVulnerable,
        message: !stillVulnerable
          ? `Verified: Dependency vulnerability ${finding.title} has been resolved.`
          : `Finding still detected: Dependency remains in vulnerable version range.`,
        verifiedAt,
      };
    }

    // 2. Source code file verification
    const targetPath = path.join(workspaceDir, finding.filePath);
    if (!fs.existsSync(targetPath)) {
      return {
        findingId: finding.id,
        resolved: true,
        message: 'Verified: File has been removed or relocated.',
        verifiedAt,
      };
    }

    const content = await fsPromises.readFile(targetPath, 'utf-8');
    const newFindings = analyzeFileContent(finding.filePath, content);
    const stillPresent = newFindings.some(f => f.ruleId === finding.ruleId && (f.lineStart === finding.lineStart || f.evidence === finding.evidence));

    return {
      findingId: finding.id,
      resolved: !stillPresent,
      message: !stillPresent
        ? `Verified: Vulnerability ${finding.ruleId} on ${finding.filePath} has been resolved.`
        : `Finding still detected on line ${finding.lineStart}. The insecure pattern is still present.`,
      verifiedAt,
      remainingDetails: stillPresent ? 'Insecure token or syntax pattern remains unmitigated.' : undefined,
    };

}
