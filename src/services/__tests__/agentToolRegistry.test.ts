import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentToolRegistry } from '../agentToolRegistry';
import { VirtualFileSystem } from '../virtualFs';

vi.mock('../desktopBridge', () => ({
  DesktopBridge: {
    executeCommand: vi.fn().mockResolvedValue({ exitCode: 0, stdout: 'ok', stderr: '' }),
    writeFile: vi.fn().mockResolvedValue(true),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

describe('AgentToolRegistry - Safety Policy Engine & Tool Interceptor', () => {
  let vfs: VirtualFileSystem;
  let registry: AgentToolRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    vfs = new VirtualFileSystem([
      { id: '1', name: 'package.json', path: 'package.json', type: 'file', content: '{}' },
      { id: '2', name: 'app.ts', path: 'src/app.ts', type: 'file', content: 'console.log("hi");' },
      { id: '3', name: '.env', path: '.env', type: 'file', content: 'SECRET=123' },
    ]);
    registry = new AgentToolRegistry(vfs, 'autonomous');
  });

  describe('Path Traversal & System Root Guards', () => {
    it('blocks path traversal attempts attempting to escape workspace', () => {
      const res = registry.evaluateSafety('write_file', {
        filePath: '/workspace/../../etc/passwd',
        content: 'malicious',
      });

      expect(res.allowed).toBe(false);
      expect(res.riskLevel).toBe('critical');
      expect(res.requiresExplicitApproval).toBe(true);
      expect(res.reason).toContain('forbidden');
    });

    it('blocks access to system root paths like /etc, /bin, C:/Windows', () => {
      const resUnix = registry.evaluateSafety('read_file', { filePath: '/etc/shadow' });
      expect(resUnix.allowed).toBe(false);
      expect(resUnix.riskLevel).toBe('critical');

      const resWin = registry.evaluateSafety('read_file', { filePath: 'C:/Windows/System32/cmd.exe' });
      expect(resWin.allowed).toBe(false);
      expect(resWin.riskLevel).toBe('critical');
    });

    it('flags sensitive credentials files for explicit approval', () => {
      const res = registry.evaluateSafety('write_file', { filePath: 'src/.env' });
      expect(res.requiresExplicitApproval).toBe(true);
      expect(res.riskLevel).toBe('high');
      expect(res.reason).toContain('sensitive credentials file');
    });
  });

  describe('Destructive Terminal Command Guards', () => {
    it('prohibits destructive rm -rf commands', () => {
      const res = registry.evaluateSafety('terminal_command', { command: 'rm -rf /' });
      expect(res.allowed).toBe(false);
      expect(res.riskLevel).toBe('critical');
      expect(res.reason).toContain('Destructive shell command prohibited');
    });

    it('prohibits SQL drop database and truncate commands', () => {
      const dropRes = registry.evaluateSafety('terminal_command', { command: 'DROP DATABASE production;' });
      expect(dropRes.allowed).toBe(false);
      expect(dropRes.riskLevel).toBe('critical');

      const truncRes = registry.evaluateSafety('terminal_command', { command: 'TRUNCATE TABLE users;' });
      expect(truncRes.allowed).toBe(false);
      expect(truncRes.riskLevel).toBe('critical');
    });

    it('prohibits git push force commands', () => {
      const res = registry.evaluateSafety('terminal_command', { command: 'git push origin main --force' });
      expect(res.allowed).toBe(false);
      expect(res.riskLevel).toBe('critical');
    });

    it('requires approval in strict mode for any shell command', () => {
      registry.setPermissionMode('strict');
      const res = registry.evaluateSafety('terminal_command', { command: 'npm test' });
      expect(res.allowed).toBe(false);
      expect(res.requiresExplicitApproval).toBe(true);
      expect(res.riskLevel).toBe('medium');
    });

    it('requires individual approval in supervised mode for modifying verbs', () => {
      registry.setPermissionMode('supervised');
      const res = registry.evaluateSafety('terminal_command', { command: 'npm install lodash' });
      expect(res.allowed).toBe(false);
      expect(res.requiresExplicitApproval).toBe(true);
    });

    it('allows benign read commands in autonomous mode', () => {
      registry.setPermissionMode('autonomous');
      const res = registry.evaluateSafety('terminal_command', { command: 'git status' });
      expect(res.allowed).toBe(true);
      expect(res.riskLevel).toBe('safe');
    });
  });

  describe('File Deletion & Modification Guards', () => {
    it('protects critical configuration files like package.json from direct deletion', () => {
      const res = registry.evaluateSafety('delete_file', { filePath: 'package.json' });
      expect(res.allowed).toBe(false);
      expect(res.riskLevel).toBe('high');
      expect(res.requiresExplicitApproval).toBe(true);
    });

    it('allows normal file operations in autonomous mode', () => {
      const res = registry.evaluateSafety('write_file', {
        filePath: 'src/utils.ts',
        content: 'export const add = (a, b) => a + b;',
      });
      expect(res.allowed).toBe(true);
      expect(res.riskLevel).toBe('safe');
    });
  });
});
