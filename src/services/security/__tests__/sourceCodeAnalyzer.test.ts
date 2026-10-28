import { describe, it, expect } from 'vitest';
import { analyzeFileContent } from '../sourceCodeAnalyzer';

describe('Security: Source Code Static Analyzer & OWASP Rules', () => {
  it('flags command injection when dynamic shell string interpolation is detected', () => {
    const code = `
const { exec } = require('child_process');
app.get('/ping', (req, res) => {
  exec(\`ping -c 1 \${req.query.host}\`, (err, stdout) => res.send(stdout));
});
`;
    const findings = analyzeFileContent('server.js', code);
    const cmdInj = findings.find(f => f.category === 'shell_injection');
    expect(cmdInj).toBeDefined();
    expect(cmdInj?.severity).toBe('critical');
    expect(cmdInj?.ruleId).toBe('SEC-SHELL-001');
  });

  it('flags dangerous eval / code injection', () => {
    const code = `
function calculate(userExpr) {
  return eval(userExpr);
}
`;
    const findings = analyzeFileContent('calc.js', code);
    const evalInj = findings.find(f => f.ruleId === 'SEC-CODE-001');
    expect(evalInj).toBeDefined();
    expect(evalInj?.severity).toBe('critical');
    expect(evalInj?.title).toContain('eval()');
  });

  it('flags SQL injection via string concatenation', () => {
    const code = `
const results = db.query("SELECT * FROM users WHERE id = " + userId);
`;
    const findings = analyzeFileContent('auth.js', code);
    const sqlInj = findings.find(f => f.ruleId === 'SEC-SQLI-001');
    expect(sqlInj).toBeDefined();
    expect(sqlInj?.severity).toBe('critical');
  });

  it('flags insecure wildcard CORS with credentials allowed', () => {
    const code = `
app.use(cors({ origin: '*', credentials: true }));
`;
    const findings = analyzeFileContent('app.js', code);
    const corsFinding = findings.find(f => f.ruleId === 'SEC-CORS-001');
    expect(corsFinding).toBeDefined();
    expect(corsFinding?.severity).toBe('high');
  });

  it('produces zero security findings on clean, defensive TypeScript code', () => {
    const safeCode = `
import { spawn } from 'child_process';

export function runCleanProcess(arg: string) {
  return spawn('ls', ['-la', arg], { shell: false });
}
`;
    const findings = analyzeFileContent('safe.ts', safeCode);
    expect(findings.length).toBe(0);
  });
});
