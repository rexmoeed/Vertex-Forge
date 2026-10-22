import { RulebookRule, RulebookViolation, GateSeverity } from '../types/kos';
import { logger } from './logger';

const RULEBOOK_STORAGE_KEY = 'vertex_rulebook_rules_v1';
const VIOLATIONS_STORAGE_KEY = 'vertex_rulebook_violations_v1';

export class RulebookEngine {
  private static rules: RulebookRule[] = [];
  private static violations: RulebookViolation[] = [];

  static {
    this.loadFromStorage();
  }

  private static loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(RULEBOOK_STORAGE_KEY);
        if (stored) {
          this.rules = JSON.parse(stored);
        }
        const storedV = localStorage.getItem(VIOLATIONS_STORAGE_KEY);
        if (storedV) {
          this.violations = JSON.parse(storedV);
        }
      }
    } catch (e) {
      logger.warn('Failed to load rulebook from storage:', e);
    }

    if (this.rules.length === 0) {
      this.rules = [
        {
          id: 'rule-env-protection',
          description: 'Strictly prohibit writing or modifying secrets and .env files directly',
          severity: 'block',
          checkType: 'protected_file',
          pattern: '**/.*env*',
          scope: ['tools', 'git_commit', 'ai_context'],
          enabled: true,
        },
        {
          id: 'rule-no-force-push',
          description: 'Block destructive git commands (force push, hard reset on main branches)',
          severity: 'block',
          checkType: 'command',
          pattern: '(git push.*--force|git reset --hard.*main|git reset --hard.*master)',
          scope: ['tools', 'terminal'],
          enabled: true,
        },
        {
          id: 'rule-dependency-governance',
          description: 'Require owner sign-off before adding or installing new npm/pip packages',
          severity: 'block',
          checkType: 'command',
          pattern: '(npm (i|install) [a-zA-Z0-9]|yarn add |pnpm add |pip install )',
          scope: ['tools', 'terminal'],
          enabled: true,
        },
        {
          id: 'rule-diff-limit',
          description: 'Advisory alert when single agent edit touches more than 350 lines',
          severity: 'advisory',
          checkType: 'diff_size',
          maxDiffLines: 350,
          scope: ['tools'],
          enabled: true,
        },
        {
          id: 'rule-system-files',
          description: 'Block file writes outside workspace boundaries or to system directories',
          severity: 'block',
          checkType: 'glob',
          pattern: '(\\/etc\\/|C:\\\\Windows|\\.\\.\\/)',
          scope: ['tools'],
          enabled: true,
        },
      ];
      this.saveToStorage();
    }
  }

  private static saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RULEBOOK_STORAGE_KEY, JSON.stringify(this.rules));
        localStorage.setItem(VIOLATIONS_STORAGE_KEY, JSON.stringify(this.violations));
      }
    } catch (e) {
      logger.warn('Failed to save rulebook to storage:', e);
    }
  }

  public static listRules(): RulebookRule[] {
    return [...this.rules];
  }

  public static toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.saveToStorage();
    }
  }

  public static addRule(newRule: Omit<RulebookRule, 'id'>): RulebookRule {
    const rule: RulebookRule = {
      ...newRule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    this.rules.push(rule);
    this.saveToStorage();
    return rule;
  }

  public static checkGate(
    scope: 'tools' | 'git_commit' | 'git_push' | 'ai_context' | 'terminal',
    target: string,
    metadata?: { diffLines?: number; command?: string }
  ): { allowed: boolean; violation?: RulebookViolation } {
    for (const rule of this.rules) {
      if (!rule.enabled || !rule.scope.includes(scope)) continue;

      let matched = false;
      let details = '';

      if (rule.checkType === 'protected_file' && rule.pattern) {
        if (/(\.env(\..+)?|id_rsa|\.pem|\.key)/i.test(target)) {
          matched = true;
          details = `Protected file matching "${rule.pattern}" was targeted.`;
        }
      } else if (rule.checkType === 'command' && rule.pattern) {
        const cmdToCheck = metadata?.command || target;
        const re = new RegExp(rule.pattern, 'i');
        if (re.test(cmdToCheck)) {
          matched = true;
          details = `Command violated rule pattern "${rule.pattern}".`;
        }
      } else if (rule.checkType === 'diff_size' && rule.maxDiffLines) {
        const lines = metadata?.diffLines || 0;
        if (lines > rule.maxDiffLines) {
          matched = true;
          details = `Diff size (${lines} lines) exceeded ceiling of ${rule.maxDiffLines} lines.`;
        }
      } else if (rule.checkType === 'glob' && rule.pattern) {
        const re = new RegExp(rule.pattern, 'i');
        if (re.test(target)) {
          matched = true;
          details = `Target path violated boundary pattern "${rule.pattern}".`;
        }
      }

      if (matched) {
        const violation: RulebookViolation = {
          id: `viol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ruleId: rule.id,
          ruleDescription: rule.description,
          severity: rule.severity,
          target,
          details,
          timestamp: Date.now(),
        };

        this.violations.push(violation);
        if (this.violations.length > 100) this.violations.shift();
        this.saveToStorage();

        if (rule.severity === 'block') {
          return { allowed: false, violation };
        }
      }
    }

    return { allowed: true };
  }

  public static overrideViolation(violationId: string, overriddenBy: string, reason: string): boolean {
    const v = this.violations.find(item => item.id === violationId);
    if (!v) return false;
    v.overridden = true;
    v.overriddenBy = overriddenBy;
    v.overrideReason = reason;
    this.saveToStorage();
    return true;
  }

  public static listViolations(): RulebookViolation[] {
    return [...this.violations].reverse();
  }
}
