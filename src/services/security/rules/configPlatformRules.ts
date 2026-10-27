import { SecurityFinding } from '../../../types/securityAudit';
import { redactSecrets } from '../secretRedactor';

export function checkConfigPlatformRules(filePath: string, lines: string[]): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // Exposing sensitive keys in frontend VITE_ environment
    if (
      filePath.includes('src/') &&
      /(?:VITE_API_SECRET|VITE_PRIVATE_KEY|VITE_DB_PASS|VITE_SERVER_SECRET)\b/.test(line)
    ) {
      findings.push({
        id: `sec-env-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-ENV-001',
        category: 'env_config',
        severity: 'high',
        title: 'Sensitive Credential Exposed to Client via VITE_ Prefix',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Variables prefixed with `VITE_` are baked into public client-side browser bundles by Vite.',
        attackVector: 'Anyone inspecting source maps or network bundles can extract secret server keys.',
        recommendedFix: 'Move server secrets to backend routes (server.ts) and access without VITE_ prefix.',
        confidence: 'high',
        confidenceReason: 'Frontend code references secret variable name with client-exposed prefix.',
        limitations: 'Static scan inspects variable naming conventions.',
        remediation: {
          type: 'config_update',
          title: 'Move secret to server-side proxy route',
          description: 'Remove VITE_ prefix and access secret exclusively within server.ts.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Logging entire process.env
    if (/console\.(?:log|dir|info)\s*\(\s*process\.env\s*\)/.test(line)) {
      findings.push({
        id: `sec-env-log-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-ENV-002',
        category: 'env_config',
        severity: 'medium',
        title: 'Unsafe Environment Logging: Full process.env Output',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Printing all environment variables may output secrets and API tokens to stdout/stderr log aggregators.',
        attackVector: 'Log exposure in SIEM or cloud logging services accessible by third parties.',
        recommendedFix: 'Log specific non-sensitive variables individually, redacting tokens.',
        confidence: 'high',
        confidenceReason: 'Direct console logging of entire process.env object.',
        limitations: 'Static detection catches direct console calls.',
        remediation: {
          type: 'code_patch',
          title: 'Remove process.env logging',
          description: 'Log only required configuration names without values.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Insecure CORS with credentials
    if (
      /cors\s*\(\s*\{[^}]*origin\s*:\s*['"]\*['"][^}]*credentials\s*:\s*true/i.test(line) ||
      (/origin\s*:\s*['"]\*['"]/.test(line) && line.includes('credentials: true'))
    ) {
      findings.push({
        id: `sec-cors-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-CORS-001',
        category: 'network_cors',
        severity: 'high',
        title: 'Insecure CORS: Wildcard Origin with Credentials',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'CORS configured with `origin: "*"` combined with `credentials: true`.',
        attackVector: 'Browsers reject this configuration or malicious third-party origins can execute cross-origin requests with user credentials.',
        recommendedFix: 'Specify an explicit trusted origin whitelist array instead of wildcard "*".',
        confidence: 'high',
        confidenceReason: 'Conflicting permissive CORS configuration detected.',
        limitations: 'Static scan only inspects CORS options object literal.',
        remediation: {
          type: 'code_patch',
          title: 'Restrict CORS allowed origins',
          description: 'Replace wildcard origin with verified origin whitelist.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Disabled TLS verification
    if (/rejectUnauthorized\s*:\s*false/.test(line) || /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]0['"]/.test(line)) {
      findings.push({
        id: `sec-tls-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-NET-001',
        category: 'network_cors',
        severity: 'critical',
        title: 'Disabled TLS Certificate Verification',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Disabling certificate validation (`rejectUnauthorized: false` or `NODE_TLS_REJECT_UNAUTHORIZED="0"`).',
        attackVector: 'Enables Man-in-the-Middle (MitM) attacks where attackers can intercept, modify, and inspect encrypted network traffic.',
        recommendedFix: 'Install trusted root CA certificates; never disable TLS verification in production.',
        confidence: 'high',
        confidenceReason: 'Explicit TLS disable flag present.',
        limitations: 'Static AST flag.',
        remediation: {
          type: 'code_patch',
          title: 'Enable strict TLS validation',
          description: 'Remove rejectUnauthorized: false and enforce valid certificates.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Improper Admin Route auth
    const isUnprotectedAdminRoute = /app\.(?:post|put|delete)\s*\(\s*['"]\/api\/(?:admin|internal|users\/delete|billing\/purge)[^'"]*['"]\s*,\s*async\s*\(/i.test(line);
    if (isUnprotectedAdminRoute) {
      findings.push({
        id: `sec-auth-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-AUTH-001',
        category: 'auth_rbac',
        severity: 'high',
        title: 'Missing Authorization Middleware on Administrative Route',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Administrative or destructive route declared without authentication/role-based access control (RBAC) middleware.',
        attackVector: 'Unauthenticated external callers can trigger administrative actions or data deletion without valid session credentials.',
        recommendedFix: 'Add authentication middleware: `app.post("/api/admin/...", requireAuth, requireRole("admin"), ...)`',
        confidence: 'high',
        confidenceReason: 'Admin endpoint pattern without intermediate middleware handlers.',
        limitations: 'Static scan inspects Express route definition signature.',
        remediation: {
          type: 'code_patch',
          title: 'Add authentication & RBAC middleware',
          description: 'Inject requireAuth and requireRole middleware into route declaration.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Hardcoded auth
    const isHardcodedAuth = /if\s*\([^)]*(?:password\s*===?\s*['"][^'"]+['"]|apiKey\s*===?\s*['"][^'"]+['"])[^)]*\)/.test(line);
    if (isHardcodedAuth && !line.includes('// test')) {
      findings.push({
        id: `sec-auth-hardcoded-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-AUTH-002',
        category: 'auth_rbac',
        severity: 'high',
        title: 'Hardcoded Credential Authentication Check',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: redactSecrets(line.trim()),
        explanation: 'Hardcoded literal compared against user password or authorization token in conditional branch.',
        attackVector: 'Attackers can decompile or inspect code to extract the master bypass credential.',
        recommendedFix: 'Use secure hashed password verification (bcrypt/argon2) against a database.',
        confidence: 'high',
        confidenceReason: 'Static string equality comparison against password or key variable.',
        limitations: 'Static analysis check.',
        remediation: {
          type: 'code_patch',
          title: 'Replace with secure password hash verification',
          description: 'Authenticate against database using bcrypt.compare.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Electron nodeIntegration
    if (/nodeIntegration\s*:\s*true/.test(line)) {
      findings.push({
        id: `sec-elec-node-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-ELEC-001',
        category: 'electron_ipc',
        severity: 'critical',
        title: 'Insecure Electron Config: nodeIntegration Enabled',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: '`nodeIntegration: true` grants renderer processes full access to Node.js APIs (`fs`, `child_process`).',
        attackVector: 'Any XSS vulnerability inside the renderer escalates immediately to full local Remote Code Execution (RCE).',
        recommendedFix: 'Set `nodeIntegration: false`, enable `contextIsolation: true`, and use a preload script with contextBridge.',
        confidence: 'high',
        confidenceReason: 'nodeIntegration: true configuration in Electron window settings.',
        limitations: 'Electron-specific rule.',
        remediation: {
          type: 'code_patch',
          title: 'Disable nodeIntegration and enable contextIsolation',
          description: 'Enforce renderer isolation and preload bridge.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Electron contextIsolation
    if (/contextIsolation\s*:\s*false/.test(line)) {
      findings.push({
        id: `sec-elec-iso-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-ELEC-002',
        category: 'electron_ipc',
        severity: 'high',
        title: 'Insecure Electron Config: contextIsolation Disabled',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Disabling `contextIsolation` allows website scripts to tamper with Electron preload APIs and prototype properties.',
        attackVector: 'Untrusted content can forge IPC messages or execute privileged preload functions.',
        recommendedFix: 'Set `contextIsolation: true` in BrowserWindow webPreferences.',
        confidence: 'high',
        confidenceReason: 'contextIsolation: false detected.',
        limitations: 'Electron webPreferences property check.',
        remediation: {
          type: 'code_patch',
          title: 'Enable contextIsolation',
          description: 'Set contextIsolation: true to isolate renderer context.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Electron webSecurity
    if (/webSecurity\s*:\s*false/.test(line)) {
      findings.push({
        id: `sec-elec-websec-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-ELEC-003',
        category: 'electron_ipc',
        severity: 'high',
        title: 'Insecure Electron Config: webSecurity Disabled',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Disabling `webSecurity` turns off Same-Origin Policy (SOP) and CORS protections inside the renderer.',
        attackVector: 'Renderer can make arbitrary requests to local files (`file://`) and cross-origin endpoints.',
        recommendedFix: 'Ensure `webSecurity: true` (default).',
        confidence: 'high',
        confidenceReason: 'webSecurity: false detected.',
        limitations: 'Electron webPreferences property check.',
        remediation: {
          type: 'code_patch',
          title: 'Enable webSecurity',
          description: 'Restore Same-Origin Policy protections.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }

    // Electron raw IPC command execution
    if (/ipcMain\.on\s*\(\s*['"][^'"]*(?:execute|command|shell|exec|run)[^'"]*['"]\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[^}]*exec/.test(line)) {
      findings.push({
        id: `sec-ipc-exec-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-IPC-001',
        category: 'electron_ipc',
        severity: 'critical',
        title: 'Unrestricted Command Execution via IPC Bridge',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'IPC handler accepts arbitrary commands from renderer process and forwards them directly to shell exec.',
        attackVector: 'A compromised renderer can issue arbitrary commands with host machine user privileges.',
        recommendedFix: 'Whitelist strict enumerated actions instead of accepting open command strings.',
        confidence: 'high',
        confidenceReason: 'Unchecked IPC listener directly invoking system exec.',
        limitations: 'Requires inspecting IPC listener implementation.',
        remediation: {
          type: 'code_patch',
          title: 'Replace raw command IPC with whitelisted action dispatch',
          description: 'Enforce strictly validated action types.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }
  }

  return findings;
}
