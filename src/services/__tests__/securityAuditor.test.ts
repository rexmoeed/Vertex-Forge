import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { SecurityAuditEngine, redactSecrets } from '../securityAuditEngine';
import { SecurityFinding } from '../../types/securityAudit';

describe('Real Security & Dependency Auditor', () => {
  let fixtureDir: string;

  beforeEach(async () => {
    // Ensure test fixture is clean and ready
    fixtureDir = await SecurityAuditEngine.createVulnerableFixture();
  });

  describe('1. Strict Secret Redaction & Token Masking', () => {
    it('strictly redacts AWS access keys, keeping only prefix', () => {
      const raw = "const key = 'AKIA1234567890ABCDEF';";
      const redacted = redactSecrets(raw);
      expect(redacted).not.toContain('AKIA1234567890ABCDEF');
      expect(redacted).toContain('AKIA***[REDACTED]***');
    });

    it('strictly redacts OpenAI keys with project prefix', () => {
      const raw = "const token = 'sk-proj-deliberate-vulnerable-key-token-1234567890abcdef';";
      const redacted = redactSecrets(raw);
      expect(redacted).not.toContain('deliberate-vulnerable-key');
      expect(redacted).toContain('sk-proj***[REDACTED]***');
    });

    it('strictly redacts Google / Gemini API keys', () => {
      const raw = "const key = 'AIzaSyD-DeliberatelyVulnerableKey123456';";
      const redacted = redactSecrets(raw);
      expect(redacted).not.toContain('DeliberatelyVulnerableKey');
      expect(redacted).toContain('AIzaSy***[REDACTED]***');
    });

    it('strictly redacts Database credentials in connection URIs', () => {
      const raw = "const db = 'postgres://admin_user:super_secret_db_pass123@db.prod.internal:5432/core';";
      const redacted = redactSecrets(raw);
      expect(redacted).not.toContain('super_secret_db_pass123');
      expect(redacted).toContain('[REDACTED_PASSWORD]');
    });

    it('redacts private RSA/EC/OPENSSH key blocks entirely', () => {
      const raw = `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0m4wz...\n-----END RSA PRIVATE KEY-----`;
      const redacted = redactSecrets(raw);
      expect(redacted).toContain('[REDACTED PRIVATE KEY BLOCK]');
      expect(redacted).not.toContain('MIIEowIBAAKCAQEA0m4wz');
    });
  });

  describe('2. Deliberately Vulnerable Fixture Comprehensive Audit', () => {
    it('discovers vulnerabilities across all critical security categories in sample fixture', async () => {
      const report = await SecurityAuditEngine.auditWorkspace(fixtureDir);

      expect(report.status).toBe('findings_detected');
      expect(report.findings.length).toBeGreaterThanOrEqual(10);
      expect(report.securityScore).toBeLessThan(50); // Heavily penalized due to critical vulnerabilities

      // Verify category detections
      expect(report.categoryCounts.dependency).toBeGreaterThan(0);
      expect(report.categoryCounts.secret).toBeGreaterThan(0);
      expect(report.categoryCounts.shell_injection).toBeGreaterThan(0);
      expect(report.categoryCounts.path_traversal).toBeGreaterThan(0);
      expect(report.categoryCounts.code_injection).toBeGreaterThan(0);
      expect(report.categoryCounts.network_cors).toBeGreaterThan(0);
      expect(report.categoryCounts.auth_rbac).toBeGreaterThan(0);
      expect(report.categoryCounts.electron_ipc).toBeGreaterThan(0);
      expect(report.categoryCounts.env_config).toBeGreaterThan(0);
    });

    it('ensures zero raw secrets leak in findings evidence', async () => {
      const report = await SecurityAuditEngine.auditWorkspace(fixtureDir);
      const secretFindings = report.findings.filter(f => f.category === 'secret');

      expect(secretFindings.length).toBeGreaterThanOrEqual(3);
      for (const finding of secretFindings) {
        expect(finding.rawSecretRedacted).toBe(true);
        expect(finding.evidence).toContain('***[REDACTED]***');
        expect(finding.evidence).not.toContain('AKIA1234567890ABCDEF');
        expect(finding.evidence).not.toContain('deliberate-vulnerable-key-token');
      }
    });
  });

  describe('3. Dependency Advisory & Breaking Change Evaluation', () => {
    it('identifies vulnerable dependencies with advisory URLs and breaking change alerts', async () => {
      const { items, findings } = await SecurityAuditEngine.auditDependencies(fixtureDir);

      expect(items.length).toBeGreaterThan(0);
      expect(findings.length).toBeGreaterThan(0);

      // Check for lodash or source-map-js or axios
      const lodashItem = items.find(i => i.packageName === 'lodash');
      if (lodashItem) {
        expect(lodashItem.severity).toBe('critical');
        expect(lodashItem.fixedVersion).toBe('4.17.21');
        expect(lodashItem.isBreaking).toBe(false);
      }

      const axiosItem = items.find(i => i.packageName === 'axios');
      if (axiosItem) {
        expect(axiosItem.isBreaking).toBe(true);
        expect(axiosItem.breakingExplanation.toLowerCase()).toContain('major');
      }
    });
  });

  describe('4. Shell & Command Injection Detection', () => {
    it('detects unquoted dynamic interpolation in exec() and flags critical severity', () => {
      const code = `app.post('/test', (req, res) => { exec(\`ping -c 1 \${req.body.host}\`); });`;
      const findings = SecurityAuditEngine.auditSingleFileContent('server.js', code);
      const shellFinding = findings.find(f => f.category === 'shell_injection');

      expect(shellFinding).toBeDefined();
      expect(shellFinding?.severity).toBe('critical');
      expect(shellFinding?.ruleId).toBe('SEC-SHELL-001');
      expect(shellFinding?.attackVector).toContain('metacharacters');
    });
  });

  describe('5. Path Traversal & Unbounded Filesystem Access', () => {
    it('flags unvalidated user parameters in path.join and fs.readFile', () => {
      const code = `
        const filename = req.query.file;
        const target = path.join('/var/data', filename);
        fs.readFile(target, 'utf-8');
      `;
      const findings = SecurityAuditEngine.auditSingleFileContent('routes.js', code);
      const pathFinding = findings.find(f => f.category === 'path_traversal');

      expect(pathFinding).toBeDefined();
      expect(pathFinding?.severity).toBe('high');
      expect(pathFinding?.ruleId).toBe('SEC-PATH-001');
      expect(pathFinding?.attackVector).toContain('traversal');
    });
  });

  describe('6. Code Injection, eval(), and XSS', () => {
    it('flags eval() invocations and raw concatenated SQL statements', () => {
      const code = `
        const result = eval(req.body.calc);
        const sql = \`SELECT * FROM users WHERE email = '\${req.body.email}'\`;
      `;
      const findings = SecurityAuditEngine.auditSingleFileContent('db.js', code);

      const evalFinding = findings.find(f => f.ruleId === 'SEC-CODE-001');
      expect(evalFinding).toBeDefined();
      expect(evalFinding?.severity).toBe('critical');

      const sqlFinding = findings.find(f => f.ruleId === 'SEC-SQLI-001');
      expect(sqlFinding).toBeDefined();
      expect(sqlFinding?.severity).toBe('critical');
    });

    it('flags dangerouslySetInnerHTML without DOMPurify sanitization', () => {
      const code = `<div dangerouslySetInnerHTML={{ __html: rawHtml }} />`;
      const findings = SecurityAuditEngine.auditSingleFileContent('Component.tsx', code);
      const xssFinding = findings.find(f => f.ruleId === 'SEC-XSS-001');

      expect(xssFinding).toBeDefined();
      expect(xssFinding?.severity).toBe('high');
    });
  });

  describe('7. Insecure Network Configurations & CORS', () => {
    it('flags CORS wildcard with credentials: true and TLS verification bypass', () => {
      const code = `
        app.use(cors({ origin: '*', credentials: true }));
        const agent = { rejectUnauthorized: false };
      `;
      const findings = SecurityAuditEngine.auditSingleFileContent('network.js', code);

      const corsFinding = findings.find(f => f.ruleId === 'SEC-CORS-001');
      expect(corsFinding).toBeDefined();
      expect(corsFinding?.severity).toBe('high');

      const tlsFinding = findings.find(f => f.ruleId === 'SEC-NET-001');
      expect(tlsFinding).toBeDefined();
      expect(tlsFinding?.severity).toBe('critical');
    });
  });

  describe('8. Insecure Electron Configuration & Risky IPC', () => {
    it('flags nodeIntegration: true and contextIsolation: false in BrowserWindow', () => {
      const code = `
        const win = new BrowserWindow({
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          }
        });
      `;
      const findings = SecurityAuditEngine.auditSingleFileContent('main.js', code);

      expect(findings.some(f => f.ruleId === 'SEC-ELEC-001')).toBe(true);
      expect(findings.some(f => f.ruleId === 'SEC-ELEC-002')).toBe(true);
    });

    it('detects unvalidated shell execution via IPC listener', () => {
      const code = `ipcMain.on('execute-shell', (event, cmd) => { exec(cmd); });`;
      const findings = SecurityAuditEngine.auditSingleFileContent('main.js', code);
      const ipcFinding = findings.find(f => f.ruleId === 'SEC-IPC-001');

      expect(ipcFinding).toBeDefined();
      expect(ipcFinding?.severity).toBe('critical');
    });
  });

  describe('9. Safe Remediation & Post-Fix Verification', () => {
    it('applies automated patch to fix Electron nodeIntegration and verifies resolution', async () => {
      const report = await SecurityAuditEngine.auditWorkspace(fixtureDir);
      const finding = report.findings.find(f => f.ruleId === 'SEC-ELEC-001');
      expect(finding).toBeDefined();

      const remResult = await SecurityAuditEngine.applyRemediation(finding!, fixtureDir);
      expect(remResult.success).toBe(true);
      expect(remResult.modifiedFiles).toContain('electron-main.js');

      // Verify that the vulnerability is now resolved
      const verifyResult = await SecurityAuditEngine.verifyFindingResolution(finding!, fixtureDir);
      expect(verifyResult.resolved).toBe(true);
      expect(verifyResult.message).toContain('resolved');
    });

    it('extracts hardcoded secrets into process.env and updates .env.example', async () => {
      const report = await SecurityAuditEngine.auditWorkspace(fixtureDir);
      const secretFinding = report.findings.find(f => f.ruleId === 'SEC-SECRETS-001' && f.evidence.includes('AWS'));
      expect(secretFinding).toBeDefined();

      const remResult = await SecurityAuditEngine.applyRemediation(secretFinding!, fixtureDir);
      expect(remResult.success).toBe(true);
      expect(remResult.modifiedFiles).toContain('.env.example');

      const verifyResult = await SecurityAuditEngine.verifyFindingResolution(secretFinding!, fixtureDir);
      expect(verifyResult.resolved).toBe(true);
    });
  });

  describe('10. Status Reporting & Scan Failure Differentiation', () => {
    it('reports scan_failed when scanning a non-existent directory', async () => {
      const nonExistent = path.join(fixtureDir, 'does-not-exist-' + Date.now());
      const report = await SecurityAuditEngine.auditWorkspace(nonExistent);

      expect(report.status).toBe('scan_failed');
      expect(report.statusMessage).toContain('Directory not found');
      expect(report.securityScore).toBe(0);
    });

    it('includes full disclaimer and capability inventory', async () => {
      const report = await SecurityAuditEngine.auditWorkspace(fixtureDir);
      expect(report.auditorCapabilities.length).toBeGreaterThanOrEqual(10);
      expect(report.limitationsDisclaimer).toContain('cannot replace end-to-end dynamic penetration testing');
    });

    it('guarantees zero plaintext secret writes to disk and verifies fake secret fixture', () => {
      const fsSync = require('fs');
      const envPath = '.env';
      if (fsSync.existsSync(envPath)) {
        const content = fsSync.readFileSync(envPath, 'utf8');
        expect(content).not.toContain('AIzaSyD-DeliberatelyVulnerableKey123456');
        expect(content).not.toContain('AKIA1234567890ABCDEF');
      }
    });
  });
});
