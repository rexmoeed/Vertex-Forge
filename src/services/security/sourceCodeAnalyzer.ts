/**
 * Source Code Static Analyzer
 * Rule-based security checks for committed secrets, injection vulnerabilities,
 * insecure configurations, and client-side exposure patterns.
 */
import { SecurityFinding } from '../../types/securityAudit';
import { SECRET_PATTERNS, redactSecrets } from './secretRedactor';
import { checkInjectionRules } from './rules/injectionRules';
import { checkConfigPlatformRules } from './rules/configPlatformRules';

export { checkInjectionRules } from './rules/injectionRules';
export { checkConfigPlatformRules } from './rules/configPlatformRules';

/**
 * Run all individual rule checkers on file content with exact line numbers and redacted evidence.
 */
export function analyzeFileContent(filePath: string, content: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = content.split('\n');

  // 1. COMMITTED SECRETS CHECK
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const lineText = lines[i];

    // Skip comment indicators in non-env files
    const trimmed = lineText.trim();
    if ((trimmed.startsWith('//') || trimmed.startsWith('*')) && !filePath.endsWith('.env')) {
      continue;
    }

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(lineText)) {
        // Check if it's an example or mock placeholder
        if (
          lineText.includes('your-api-key') ||
          lineText.includes('placeholder') ||
          lineText.includes('AIzaSyD-TEST-MOCK')
        ) {
          continue;
        }

        const redactedEvidence = redactSecrets(lineText);
        findings.push({
          id: `sec-secret-${filePath}-${lineNum}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          ruleId: 'SEC-SECRETS-001',
          category: 'secret',
          severity: 'critical',
          title: `Hardcoded Secret Detected: ${pattern.name}`,
          filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          evidence: redactedEvidence.trim(),
          rawSecretRedacted: true,
          explanation: `Sensitive credentials (${pattern.name}) were found hardcoded directly in source code. If committed or built into client bundles, attackers can extract them.`,
          attackVector: 'Credential compromise leading to unauthorized cloud API access, billing spikes, or data exfiltration.',
          recommendedFix: `Extract secret into environment variables (.env) and access via process.env. Never commit raw credentials.`,
          confidence: 'high',
          confidenceReason: 'High-entropy pattern and known vendor key prefix matched.',
          limitations: 'Static regex detection cannot verify if the token is revoked on vendor servers.',
          remediation: {
            type: 'redact_secret',
            title: 'Move secret to environment variable',
            description: 'Replace hardcoded literal with process.env.API_KEY and add template to .env.example.',
            targetFile: filePath,
            lineStart: lineNum,
            lineEnd: lineNum,
            requiresApproval: true,
          },
        });
        break; // Avoid double reporting on same line
      }
    }
  }

  // 2. INJECTION VULNERABILITIES (Shell, Path, Eval, Function, SQLi, XSS)
  findings.push(...checkInjectionRules(filePath, lines));

  // 3. CONFIGURATION & PLATFORM SECURITY (Env, CORS, TLS, Auth, Electron)
  findings.push(...checkConfigPlatformRules(filePath, lines));

  return findings;
}
