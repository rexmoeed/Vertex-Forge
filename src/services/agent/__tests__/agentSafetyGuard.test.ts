import { describe, it, expect } from 'vitest';
import { evaluateToolSafety } from '../agentSafetyGuard';

describe('Security: Agent Safety Guard & Command Interceptors', () => {
  describe('Path Traversal & System Root Guards', () => {
    it('blocks directory escape attempts with /../.. traversal', () => {
      const result = evaluateToolSafety(
        'read_file',
        { filePath: 'src/../../../../etc/passwd' },
        'supervised'
      );
      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe('critical');
      expect(result.reason).toContain('forbidden');
    });

    it('blocks access to Unix system directories (/etc, /root, /bin)', () => {
      const result = evaluateToolSafety(
        'write_file',
        { filePath: '/etc/shadow', content: 'test' },
        'supervised'
      );
      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe('critical');
    });

    it('blocks access to Windows system directory (C:/Windows)', () => {
      const result = evaluateToolSafety(
        'read_file',
        { filePath: 'C:/Windows/System32/cmd.exe' },
        'supervised'
      );
      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe('critical');
    });

    it('requires explicit approval when touching .env or credentials files', () => {
      const result = evaluateToolSafety(
        'read_file',
        { filePath: '.env' },
        'supervised'
      );
      expect(result.requiresExplicitApproval).toBe(true);
      expect(result.riskLevel).toBe('high');
      expect(result.reason).toContain('sensitive credentials file');
    });
  });

  describe('Destructive Terminal Command Interceptors', () => {
    it('blocks recursive root directory deletion (rm -rf /)', () => {
      const result = evaluateToolSafety(
        'terminal_command',
        { command: 'rm -rf /' },
        'supervised'
      );
      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe('critical');
    });

    it('blocks destructive database dropping commands', () => {
      const result = evaluateToolSafety(
        'terminal_command',
        { command: 'psql -c "DROP DATABASE production;"' },
        'supervised'
      );
      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe('critical');
    });

    it('blocks git force push commands', () => {
      const result = evaluateToolSafety(
        'terminal_command',
        { command: 'git push origin main --force' },
        'supervised'
      );
      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe('critical');
    });

    it('allows benign developer shell commands like npm test or git status', () => {
      const result = evaluateToolSafety(
        'terminal_command',
        { command: 'npm test' },
        'supervised'
      );
      expect(result.allowed).toBe(true);
    });
  });
});
