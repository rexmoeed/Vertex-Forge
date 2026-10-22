import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TerminalService, TerminalSession, TerminalSettings } from '../terminalService';

describe('TerminalService Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).desktopAPI;
  });

  describe('Platform & Shell Detection', () => {
    it('detects win32 platform from userAgent', () => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      expect(TerminalService.getHostPlatform()).toBe('win32');
      expect(TerminalService.getDefaultShellForPlatform()).toBe('powershell');
    });

    it('detects darwin platform from userAgent', () => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      expect(TerminalService.getHostPlatform()).toBe('darwin');
      expect(TerminalService.getDefaultShellForPlatform()).toBe('zsh');
    });

    it('falls back to linux and bash when userAgent has no win/mac match', () => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (X11; Linux x86_64)');
      expect(TerminalService.getHostPlatform()).toBe('linux');
      expect(TerminalService.getDefaultShellForPlatform()).toBe('bash');
    });
  });

  describe('Settings Storage & Persistence', () => {
    it('loads default settings when localStorage is empty', () => {
      const settings = TerminalService.loadSettings();
      expect(settings).toBeDefined();
      expect(settings.fontSize).toBe(12);
      expect(settings.cursorBlink).toBe(true);
      expect(settings.cursorStyle).toBe('block');
      expect(settings.scrollbackLimit).toBe(1000);
    });

    it('saves and reloads custom terminal settings', () => {
      const custom: TerminalSettings = {
        defaultShell: 'zsh',
        fontSize: 14,
        cursorBlink: false,
        cursorStyle: 'underline',
        scrollbackLimit: 2000,
        theme: 'monokai',
      };
      TerminalService.saveSettings(custom);

      const loaded = TerminalService.loadSettings();
      expect(loaded).toEqual(custom);
    });

    it('falls back to defaults if stored JSON is corrupted', () => {
      localStorage.setItem('vertex_terminal_settings_v2', '{invalid_json}');
      const loaded = TerminalService.loadSettings();
      expect(loaded.fontSize).toBe(12);
      expect(loaded.cursorStyle).toBe('block');
    });
  });

  describe('Session Lifecycle & Creation', () => {
    it('creates a default terminal session with welcome headers', () => {
      const session = TerminalService.createDefaultSession('/custom/project');
      expect(session.id).toMatch(/^term-\d+/);
      expect(session.cwd).toBe('/custom/project');
      expect(session.isRunning).toBe(false);
      expect(session.logs.length).toBeGreaterThanOrEqual(2);
      expect(session.history).toEqual([]);
      expect(session.historyIndex).toBe(-1);
    });
  });

  describe('Built-in Shell Commands', () => {
    let session: TerminalSession;

    beforeEach(() => {
      session = TerminalService.createDefaultSession('/workspace/app');
    });

    it('returns empty result when command is empty or whitespace', async () => {
      const res = await TerminalService.executeCommand(session, '   ');
      expect(res).toEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(session.isRunning).toBe(false);
    });

    it('executes clear command by flushing logs', async () => {
      const onUpdate = vi.fn();
      const res = await TerminalService.executeCommand(session, 'clear', undefined, onUpdate);

      expect(res.exitCode).toBe(0);
      expect(session.logs).toEqual([]);
      expect(session.isRunning).toBe(false);
      expect(onUpdate).toHaveBeenCalled();
    });

    it('executes pwd command printing current working directory', async () => {
      const res = await TerminalService.executeCommand(session, 'pwd');
      expect(res.stdout).toBe('/workspace/app');
      expect(res.exitCode).toBe(0);
      const lastLog = session.logs[session.logs.length - 1];
      expect(lastLog.text).toBe('/workspace/app');
      expect(lastLog.type).toBe('stdout');
    });

    it('handles cd .. parent directory navigation on POSIX path', async () => {
      session.cwd = '/workspace/app';
      const res = await TerminalService.executeCommand(session, 'cd ..');

      expect(res.exitCode).toBe(0);
      expect(session.cwd).toBe('/workspace');
    });

    it('handles cd with relative directory', async () => {
      session.cwd = '/workspace';
      const res = await TerminalService.executeCommand(session, 'cd src');

      expect(res.exitCode).toBe(0);
      expect(session.cwd).toBe('/workspace/src');
    });

    it('handles cd with absolute directory path', async () => {
      session.cwd = '/workspace';
      const res = await TerminalService.executeCommand(session, 'cd /var/log');

      expect(res.exitCode).toBe(0);
      expect(session.cwd).toBe('/var/log');
    });

    it('handles cd ~ navigation back to root workspace', async () => {
      session.cwd = '/workspace/app/subfolder';
      const res = await TerminalService.executeCommand(session, 'cd ~');

      expect(res.exitCode).toBe(0);
      expect(session.cwd).toBe('/workspace');
    });
  });

  describe('Native Desktop Shell & Process Interruption', () => {
    it('executes command via window.desktopAPI when Electron is active', async () => {
      const mockExecute = vi.fn().mockResolvedValue({
        stdout: 'v20.10.0\n',
        stderr: '',
        exitCode: 0,
      });

      (window as any).desktopAPI = {
        executeCommand: mockExecute,
      };

      const session = TerminalService.createDefaultSession('/app');
      const onUpdate = vi.fn();
      const res = await TerminalService.executeCommand(session, 'node -v', undefined, onUpdate);

      expect(mockExecute).toHaveBeenCalledWith('node -v', { cwd: '/app' });
      expect(res.stdout).toContain('v20.10.0');
      expect(res.exitCode).toBe(0);
      expect(session.logs.some(l => l.text === 'v20.10.0')).toBe(true);
    });

    it('captures stderr from failed command execution via desktopAPI', async () => {
      (window as any).desktopAPI = {
        executeCommand: vi.fn().mockResolvedValue({
          stdout: '',
          stderr: 'npm ERR! Missing script: build\n',
          exitCode: 1,
        }),
      };

      const session = TerminalService.createDefaultSession('/app');
      const res = await TerminalService.executeCommand(session, 'npm run build');

      expect(res.exitCode).toBe(1);
      expect(res.stderr).toContain('Missing script');
      expect(session.logs.some(l => l.type === 'stderr')).toBe(true);
    });

    it('interrupts running command and marks session status as cancelled', async () => {
      const session = TerminalService.createDefaultSession('/app');
      session.isRunning = true;
      session.currentCommand = 'npm test';

      const onUpdate = vi.fn();
      await TerminalService.interruptCommand(session, onUpdate);

      expect(session.isRunning).toBe(false);
      expect(session.currentCommand).toBeUndefined();
      expect(session.logs.some(l => l.text.includes('^C') || l.text.includes('SIGINT'))).toBe(true);
      expect(onUpdate).toHaveBeenCalledWith(session);
    });
  });

  describe('Error Context Diagnostic Extractor', () => {
    it('extracts actionable error diagnostics from session logs', () => {
      const session = TerminalService.createDefaultSession('/app');
      session.logs.push(
        { type: 'input', text: 'npm run test', timestamp: '12:00:00' },
        { type: 'stderr', text: 'Error: Cannot find module ./config', timestamp: '12:00:01', exitCode: 1 }
      );

      const errorContext = TerminalService.extractErrorContext(session);
      expect(errorContext).toContain('Cannot find module');
    });

    it('returns empty string when session contains no error logs', () => {
      const session = TerminalService.createDefaultSession('/app');
      session.logs.push(
        { type: 'input', text: 'echo ok', timestamp: '12:00:00' },
        { type: 'stdout', text: 'ok', timestamp: '12:00:01', exitCode: 0 }
      );

      const errorContext = TerminalService.extractErrorContext(session);
      expect(errorContext).toContain('No active errors found');
    });
  });
});
