import { describe, it, expect, beforeEach } from 'vitest';
import { CredentialVaultService } from '../credentialVaultService';
import { RulebookEngine } from '../rulebookEngine';
import { SecretScannerService } from '../secretScannerService';
import { MultiAiCouncilService } from '../multiAiCouncilService';
import { PersistentMemoryService } from '../persistentMemoryService';
import { SkillSetService } from '../skillSetService';
import { BusinessTrackerService } from '../businessTrackerService';
import { ApprovalQueueService } from '../approvalQueueService';
import { BackgroundJobScheduler } from '../backgroundJobScheduler';
import { ModelRouterService } from '../modelRouterService';
import { VersioningService } from '../versioningService';

describe('KOS Parity Governance & Operations Engine', () => {
  describe('1. Credential Vault & Secret Redaction', () => {
    it('stores secrets with masked previews and never returns raw secrets in listing', () => {
      const secret = CredentialVaultService.addSecret('prod-db-url', 'postgres://admin:secret123@prod.internal:5432/main', 'db_credential', 'always_ask');
      expect(secret.maskedPreview).toContain('••••');
      expect(secret.maskedPreview).not.toContain('secret123');

      const list = CredentialVaultService.listSecrets();
      const found = list.find(s => s.name === 'prod-db-url');
      expect(found).toBeDefined();
      expect((found as any).encryptedValue).toBeUndefined();
    });

    it('enforces always_ask policy and logs audit trail for every injection request', () => {
      const res = CredentialVaultService.requestSecretInjection('vault:prod-db-url', 'agent', 'read_db');
      expect(res.granted).toBe(false);
      expect(res.reason).toContain('requires explicit owner authorization');

      const audit = CredentialVaultService.getAuditLog();
      const latest = audit[0];
      expect(latest.secretName).toBe('prod-db-url');
      expect(latest.granted).toBe(false);
    });

    it('redacts known and pattern-based secrets from text buffers', () => {
      const rawText = 'Connected to server using sk-1234567890abcdef1234567890abcdef12 and AIzaSyD-1234567890abcdef1234567890abcde';
      const redacted = CredentialVaultService.redactSecrets(rawText);
      expect(redacted).toContain('[REDACTED_OPENAI_KEY]');
      expect(redacted).toContain('[REDACTED_GEMINI_KEY]');
      expect(redacted).not.toContain('sk-1234567890');
    });
  });

  describe('2. Rulebook with Hard Pre-Execution Gates', () => {
    it('blocks file writes targeted at .env and secrets', () => {
      const gate = RulebookEngine.checkGate('tools', '.env.production');
      expect(gate.allowed).toBe(false);
      expect(gate.violation).toBeDefined();
      expect(gate.violation?.severity).toBe('block');
    });

    it('blocks destructive git force push commands', () => {
      const gate = RulebookEngine.checkGate('tools', 'git push origin main --force', {
        command: 'git push origin main --force',
      });
      expect(gate.allowed).toBe(false);
      expect(gate.violation?.severity).toBe('block');
    });

    it('permits safe workspace files within boundary', () => {
      const gate = RulebookEngine.checkGate('tools', 'src/components/Header.tsx', {
        diffLines: 25,
      });
      expect(gate.allowed).toBe(true);
    });

    it('logs violations and supports owner override', () => {
      const violations = RulebookEngine.listViolations();
      expect(violations.length).toBeGreaterThan(0);
      const targetV = violations[0];
      const overridden = RulebookEngine.overrideViolation(targetV.id, 'Principal Architect', 'Emergency test override');
      expect(overridden).toBe(true);
    });
  });

  describe('3. Secret Scanning & Tamper Detection', () => {
    it('detects high-entropy keys and credentials in file content', () => {
      const sampleFile = `
        const GEMINI = "AIzaSyD-example1234567890abcdef1234567";
        const GITHUB = "ghp_1234567890abcdef1234567890abcdef";
      `;
      const findings = SecretScannerService.scanText(sampleFile, 'src/config.ts');
      expect(findings.length).toBe(2);
      expect(findings[0].type).toBe('Google Gemini API Key');
      expect(findings[1].type).toBe('GitHub Personal Token');
    });

    it('registers protected files and flags unauthorized tamper changes', () => {
      SecretScannerService.registerProtectedFile('.vertex/rulebook.yaml', 'rules: strict');
      const verifyGood = SecretScannerService.verifyFile('.vertex/rulebook.yaml', 'rules: strict');
      expect(verifyGood.ok).toBe(true);

      const verifyTampered = SecretScannerService.verifyFile('.vertex/rulebook.yaml', 'rules: modified_by_agent');
      expect(verifyTampered.ok).toBe(false);
      expect(verifyTampered.entry?.tampered).toBe(true);
    });
  });

  describe('4. Multi-AI Council Deliberation', () => {
    it('convenes council session with consensus verdict and member rationale', async () => {
      const session = await MultiAiCouncilService.conveneCouncil('Refactor state management from Redux to Zustand');
      expect(session.id).toBeDefined();
      expect(session.votes.length).toBe(4);
      expect(session.consensusSummary).toContain('Council reached');
      expect(session.finalVerdict).toMatch(/approved|rejected|pending/);
    });
  });

  describe('5. Persistent Memory Layers', () => {
    it('proposes memory with confidence and allows owner approval', () => {
      const mem = PersistentMemoryService.proposeMemory(
        'decision',
        'workspace',
        'workspace-1',
        'Authentication Provider',
        'Use local session tokens with argon2 password hashing',
        'User Directive',
        ['auth', 'security']
      );
      expect(mem.approved).toBe(false);

      const approved = PersistentMemoryService.approveMemory(mem.id);
      expect(approved).toBe(true);

      const queried = PersistentMemoryService.queryMemories('authentication');
      expect(queried.length).toBeGreaterThan(0);
      expect(queried[0].title).toBe('Authentication Provider');
    });
  });

  describe('6. Skill Sets & Triggers', () => {
    it('matches slash commands to executable skills', () => {
      const match = SkillSetService.findMatchingSkill('/review src/App.tsx');
      expect(match).toBeDefined();
      expect(match?.name).toBe('code-review');
      expect(match?.allowedTools).toContain('read_file');
    });
  });

  describe('7. Businesses & Isolated Trackers', () => {
    it('switches business context and tracks Kanban items without leakage', () => {
      const businesses = BusinessTrackerService.listBusinesses();
      expect(businesses.length).toBe(6);

      const newTask = BusinessTrackerService.addTrackerItem({
        businessId: 'biz-1',
        title: 'Audit Electron native PTY bindings',
        description: 'Verify node-pty runs cleanly inside packaged ASAR.',
        status: 'backlog',
        priority: 'high',
      });
      expect(newTask.id).toBeDefined();

      const moved = BusinessTrackerService.moveTrackerItem(newTask.id, 'in_progress');
      expect(moved).toBe(true);

      const biz1Items = BusinessTrackerService.listTrackerItems('biz-1');
      const biz2Items = BusinessTrackerService.listTrackerItems('biz-2');
      expect(biz1Items.some(i => i.id === newTask.id)).toBe(true);
      expect(biz2Items.some(i => i.id === newTask.id)).toBe(false);
    });
  });

  describe('8. Owner Approval Queue', () => {
    it('enqueues pending approvals and blocks auto-resolution', () => {
      const item = ApprovalQueueService.enqueueItem(
        'Deploy to Staging',
        'deploy',
        'critical',
        'Agent Orchestrator',
        'Automated release workflow completed'
      );
      expect(item.status).toBe('pending');

      const pending = ApprovalQueueService.listPending();
      expect(pending.some(p => p.id === item.id)).toBe(true);

      ApprovalQueueService.resolveItem(item.id, 'approved', 'Owner verified deploy manifest');
      const all = ApprovalQueueService.listAll();
      const updated = all.find(i => i.id === item.id);
      expect(updated?.status).toBe('approved');
      expect(updated?.resolutionNote).toContain('Owner verified');
    });
  });

  describe('9. Self-Healing Background Jobs', () => {
    it('manages background schedules and resets circuit breaker', async () => {
      const jobs = BackgroundJobScheduler.listJobs();
      expect(jobs.length).toBeGreaterThan(0);

      const target = jobs[0];
      const res = await BackgroundJobScheduler.triggerJob(target.id);
      expect(res.success).toBe(true);

      const reset = BackgroundJobScheduler.resetCircuitBreaker(target.id);
      expect(reset).toBe(true);
    });
  });

  describe('10. Task Model Routing', () => {
    it('returns tuned model and cost ceiling per category', () => {
      const autocompleteRoute = ModelRouterService.getRoute('autocomplete');
      expect(autocompleteRoute.primaryModel).toBe('gemini-2.5-flash');
      expect(autocompleteRoute.costCeilingPerReqUsd).toBeLessThan(0.001);

      const planningRoute = ModelRouterService.getRoute('agent_planning');
      expect(planningRoute.primaryModel).toBe('gemini-2.5-pro');
      expect(planningRoute.fallbackChain.length).toBeGreaterThan(0);
    });
  });

  describe('11. Semantic Versioning', () => {
    it('bumps minor version and records release changelog', () => {
      const before = VersioningService.getCurrentVersion();
      const release = VersioningService.bumpVersion('minor', 'Feature update release');
      expect(release.version).not.toBe(before);
      expect(release.bumpType).toBe('minor');
    });
  });
});
