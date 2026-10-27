import { SecurityFinding } from '../../../types/securityAudit';

export function checkInjectionRules(filePath: string, lines: string[]): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // Shell execution
    const isExecWithConcat =
      /(?:exec|execSync)\s*\(\s*[`"][^`"]*\$\{[^}]+\}[^`"]*[`"]/.test(line) ||
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

    // Path traversal
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

    // Eval
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

    // new Function
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

    // SQLi
    const isSqlConcat =
      /(?:query|raw|execute)\s*\(\s*[`"][^`"]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)[^`"]*\$\{[^}]+\}/i.test(line) ||
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

    // XSS
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

  return findings;
}
