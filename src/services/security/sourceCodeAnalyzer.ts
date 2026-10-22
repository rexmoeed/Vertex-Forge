/**
 * Source Code Static Analyzer
 * Rule-based security checks for committed secrets, injection vulnerabilities,
 * insecure configurations, and client-side exposure patterns.
 */
import { SecurityFinding } from '../../types/securityAudit';
import { SECRET_PATTERNS, redactSecrets } from './secretRedactor';

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
        if (lineText.includes('your-api-key') || lineText.includes('placeholder') || lineText.includes('AIzaSyD-TEST-MOCK')) {
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
   // 2. DANGEROUS SHELL EXECUTION PATTERNS
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
     // Detect exec with template literals or concatenation
    const isExecWithConcat = /(?:exec|execSync)\s*\(\s*[`"][^`"]*\$\{[^}]+\}[^`"]*[`"]/.test(line) ||
                             /(?:exec|execSync)\s*\([^)]*\+[^)]*\)/.test(line);
    const isSpawnWithShell = /spawn\s*\([^,]+,[^,]+,\s*\{[^}]*shell:\s*true/.test(line);
     if (isExecWithConcat || isSpawnWithShell) {
      findings.push({
        id: `sec-shell-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-SHELL-001',
        category: 'shell_injection',
        severity: 'critical',
        title: 'Command Injection: Unsafe Shell Execution',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Dynamic string concatenation or interpolation passed to shell execution (`exec` or `spawn(..., { shell: true })`).',
        attackVector: 'Attackers can inject shell metacharacters (e.g. `; rm -rf /`, `| curl attacker.com`) to execute arbitrary operating system commands.',
        recommendedFix: 'Use `execFile` or parameterized `spawn` with an array of arguments, without shell interpretation.',
        confidence: 'high',
        confidenceReason: 'Dynamic interpolation in system execution call identified.',
        limitations: 'Analyzer assumes inputs may be tainted from HTTP or user parameters.',
        remediation: {
          type: 'code_patch',
          title: 'Use parameterized spawnFile / execFile',
          description: 'Refactor string interpolation to parameterized arguments array.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }
  }
   // 3. PATH TRAVERSAL RISKS
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
     // Detect path.join with req.query/params/body or direct user input in fs.readFile
    const isUnsafePathJoin = /path\.(?:join|resolve)\s*\([^)]*(?:req\.(?:query|params|body)|userInput|filename|\bfile\b|filePath|targetPath|userPath|req|params|query)[^)]*\)/.test(line);
    const isDirectFsUserPath = /fs\.(?:readFile|readFileSync|createReadStream|writeFile)\s*\([^)]*(?:req\.(?:query|params|body)|filePath|userFile|\bfile\b)[^)]*\)/.test(line);
     if (isUnsafePathJoin || isDirectFsUserPath) {
      findings.push({
        id: `sec-path-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-PATH-001',
        category: 'path_traversal',
        severity: 'high',
        title: 'Path Traversal: Unbounded Filesystem Access',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'File path constructed from unvalidated request parameters or variables without path containment checks.',
        attackVector: 'Directory traversal payloads (`../../../../etc/passwd` or `..\\..\\windows\\win.ini`) can expose sensitive system files.',
        recommendedFix: 'Resolve path with `path.resolve` and verify `resolvedPath.startsWith(allowedBasePath)`.',
        confidence: 'high',
        confidenceReason: 'Direct user parameter passed to path resolution or filesystem operation.',
        limitations: 'Static checks cannot verify if upstream custom sanitizers normalize dot-dot sequences.',
        remediation: {
          type: 'code_patch',
          title: 'Add boundary containment validation',
          description: 'Enforce target path stays within base directory boundary using path.resolve.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }
  }
   // 4. CODE INJECTION & UNSAFE DESERIALIZATION
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
     if (/\beval\s*\(/.test(line) && !line.includes('// safe-eval')) {
      findings.push({
        id: `sec-eval-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-CODE-001',
        category: 'code_injection',
        severity: 'critical',
        title: 'Arbitrary Code Execution via eval()',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: '`eval()` interprets arbitrary text as JavaScript in the active execution context.',
        attackVector: 'Input passed to eval can execute arbitrary code with full application permissions.',
        recommendedFix: 'Refactor away from dynamic code execution; use JSON.parse() or dedicated AST parsers.',
        confidence: 'high',
        confidenceReason: 'Explicit eval() invocation found.',
        limitations: 'None; eval should virtually never be used with user-controlled input.',
        remediation: {
          type: 'code_patch',
          title: 'Replace eval with safe parsing',
          description: 'Use JSON.parse or strict domain-specific parser.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }
     if (/\bnew\s+Function\s*\(/.test(line)) {
      findings.push({
        id: `sec-function-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-CODE-002',
        category: 'code_injection',
        severity: 'high',
        title: 'Unsafe Dynamic Code Execution: new Function()',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: '`new Function()` acts as an indirect eval, compiling runtime strings into executable code.',
        attackVector: 'Allows arbitrary script execution if string parameters incorporate external inputs.',
        recommendedFix: 'Replace dynamic Function constructor with pre-compiled functions or safe interpreter.',
        confidence: 'high',
        confidenceReason: 'Dynamic Function constructor instantiation detected.',
        limitations: 'Static scan flags all instances regardless of input source.',
        remediation: {
          type: 'code_patch',
          title: 'Remove dynamic Function compilation',
          description: 'Replace with static dispatch table.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }
     // SQL Injection via string interpolation or query concatenation
    const isSqlConcat = /(?:query|raw|execute)\s*\(\s*[`"][^`"]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)[^`"]*\$\{[^}]+\}/i.test(line) ||
                        /(?:query|raw|execute)\s*\([^)]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)[^)]*\+[^)]*\)/i.test(line) ||
                        /(?:sql|query|stmt)\s*=\s*[`"][^`"]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)[^`"]*\$\{[^}]+\}/i.test(line) ||
                        /(?:sql|query|stmt)\s*=\s*["'][^"']*(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)[^"']*["']\s*\+/i.test(line);
    if (isSqlConcat) {
      findings.push({
        id: `sec-sqli-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-SQLI-001',
        category: 'code_injection',
        severity: 'critical',
        title: 'SQL Injection: Concatenated Database Query',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'SQL statement constructed via string concatenation or interpolation rather than parameterized placeholders.',
        attackVector: 'Attackers can bypass authentication, read unauthorized database tables, or drop schemas.',
        recommendedFix: 'Use parameterized queries with $1, ?, or ORM query builders.',
        confidence: 'high',
        confidenceReason: 'Unparameterized SQL keywords concatenated with variables.',
        limitations: 'Static analysis cannot inspect runtime database engine escape logic.',
        remediation: {
          type: 'code_patch',
          title: 'Use Parameterized Query',
          description: 'Convert query string interpolation to parameterized binding array.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }
     // XSS: dangerouslySetInnerHTML without DOMPurify
    if (/dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/.test(line) && !line.includes('DOMPurify.sanitize')) {
      findings.push({
        id: `sec-xss-${filePath}-${lineNum}-${Date.now()}`,
        ruleId: 'SEC-XSS-001',
        category: 'code_injection',
        severity: 'high',
        title: 'Cross-Site Scripting (XSS): Unsanitized dangerouslySetInnerHTML',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        evidence: line.trim(),
        explanation: 'Rendering raw HTML via dangerouslySetInnerHTML without HTML sanitization (DOMPurify).',
        attackVector: 'Injected `<script>` or `<img onerror=...>` tags execute inside user browser sessions.',
        recommendedFix: 'Wrap raw HTML in DOMPurify.sanitize() or use standard React text rendering.',
        confidence: 'high',
        confidenceReason: 'dangerouslySetInnerHTML present without sanitization call.',
        limitations: 'Analyzer checks for DOMPurify on the same line or immediate context.',
        remediation: {
          type: 'code_patch',
          title: 'Add DOMPurify.sanitize',
          description: 'Sanitize HTML content with DOMPurify before passing to __html.',
          targetFile: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          requiresApproval: false,
        },
      });
    }
  }
   // 5. UNSAFE ENVIRONMENT VARIABLE HANDLING
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
     // Exposing sensitive keys in frontend VITE_ environment
    if (filePath.includes('src/') && /(?:VITE_API_SECRET|VITE_PRIVATE_KEY|VITE_DB_PASS|VITE_SERVER_SECRET)\b/.test(line)) {
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
  }
   // 6. INSECURE NETWORK CONFIGURATIONS & CORS
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
     // Insecure CORS with credentials
    if (/cors\s*\(\s*\{[^}]*origin\s*:\s*['"]\*['"][^}]*credentials\s*:\s*true/i.test(line) ||
        (/origin\s*:\s*['"]\*['"]/.test(line) && line.includes('credentials: true'))) {
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
  }
   // 7. IMPROPER AUTHENTICATION & RBAC CHECKS
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
     // Sensitive admin route without auth middleware: e.g. app.post('/api/admin/...') with no middleware parameter
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
     // Hardcoded credential checks
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
  }
   // 8. INSECURE ELECTRON CONFIGURATION
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
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
  }
   // 9. RISKY IPC APIS
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
     // Exposing raw shell or arbitrary execution via IPC
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
 // ==========================================
