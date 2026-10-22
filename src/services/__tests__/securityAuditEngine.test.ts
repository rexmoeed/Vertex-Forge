import { describe, it, expect } from 'vitest';
import {
  SecurityAuditEngine,
  redactSecrets,
  KNOWN_ADVISORIES,
  isVersionVulnerable,
} from '../securityAuditEngine';

describe('SecurityAuditEngine Core Capabilities', () => {
  describe('redactSecrets() - 5+ Realistic Secret Patterns', () => {
    it('redacts AWS Access Key IDs (AKIA prefix)', () => {
      const snippet = 'const aws = { accessKeyId: "AKIAIOSFODNN7EXAMPLE" };';
      const redacted = redactSecrets(snippet);
      expect(redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(redacted).toContain('AKIA***[REDACTED]***');
    });

    it('redacts OpenAI Project and Secret API keys (sk-proj prefix)', () => {
      const snippet = "const token = 'sk-proj-deliberate-vulnerable-key-token-1234567890abcdef';";
      const redacted = redactSecrets(snippet);
      expect(redacted).not.toContain('deliberate-vulnerable-key');
      expect(redacted).toContain('sk-proj***[REDACTED]***');
    });

    it('redacts Google / Gemini Cloud API keys (AIzaSy prefix)', () => {
      const snippet = "const key = 'AIzaSyD-DeliberatelyVulnerableKey123456';";
      const redacted = redactSecrets(snippet);
      expect(redacted).not.toContain('DeliberatelyVulnerableKey');
      expect(redacted).toContain('AIzaSy***[REDACTED]***');
    });

    it('redacts Database credentials in connection URIs (postgres/mysql/mongodb)', () => {
      const snippet = 'const uri = "postgres://dbadmin:Sup3rS3cr3tP@ssw0rd!@pg.prod:5432/core";';
      const redacted = redactSecrets(snippet);
      expect(redacted).not.toContain('Sup3rS3cr3tP@ssw0rd!');
      expect(redacted).toContain('[REDACTED_PASSWORD]');
    });

    it('redacts RSA / EC / SSH private key header blocks', () => {
      const snippet = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0m4wz...\n-----END RSA PRIVATE KEY-----';
      const redacted = redactSecrets(snippet);
      expect(redacted).toContain('[REDACTED PRIVATE KEY BLOCK]');
      expect(redacted).not.toContain('MIIEowIBAAKCAQEA0m4wz');
    });
  });

  describe('KNOWN_ADVISORIES & Version Vulnerability Lookup', () => {
    it('contains curated entries for high-profile vulnerable packages', () => {
      expect(KNOWN_ADVISORIES.length).toBeGreaterThanOrEqual(5);

      const packages = KNOWN_ADVISORIES.map(a => a.package);
      expect(packages).toContain('lodash');
      expect(packages).toContain('axios');
      expect(packages).toContain('ws');
    });

    it('accurately identifies semver vulnerability ranges with isVersionVulnerable', () => {
      const lodashAdv = KNOWN_ADVISORIES.find(a => a.package === 'lodash');
      expect(lodashAdv).toBeDefined();

      if (lodashAdv) {
        // Lodash < 4.17.21 is vulnerable
        expect(isVersionVulnerable('4.17.15', lodashAdv.vulnerableRange)).toBe(true);
        expect(isVersionVulnerable('4.17.20', lodashAdv.vulnerableRange)).toBe(true);
        expect(isVersionVulnerable('4.17.21', lodashAdv.vulnerableRange)).toBe(false);
        expect(isVersionVulnerable('4.18.0', lodashAdv.vulnerableRange)).toBe(false);
      }
    });

    it('flags breaking changes in dependency upgrades appropriately', () => {
      const axiosAdv = KNOWN_ADVISORIES.find(a => a.package === 'axios');
      expect(axiosAdv).toBeDefined();
      expect(axiosAdv?.isBreaking).toBe(true);
      expect(axiosAdv?.breakingExplanation.toLowerCase()).toContain('major');
    });
  });

  describe('SecurityAuditEngine Static Orchestrator Methods', () => {
    it('audits single file content for shell injection', () => {
      const code = 'const exec = require("child_process").exec; exec(`ls ${req.query.dir}`);';
      const findings = SecurityAuditEngine.auditSingleFileContent('src/server.ts', code);
      expect(findings.some(f => f.category === 'shell_injection')).toBe(true);
    });

    it('returns capabilities inventory and limitations disclaimer', () => {
      const capabilities = SecurityAuditEngine.getCapabilities();
      expect(capabilities.length).toBeGreaterThanOrEqual(10);
      const disclaimer = SecurityAuditEngine.getLimitationsDisclaimer();
      expect(disclaimer).toContain('cannot replace');
    });
  });
});
