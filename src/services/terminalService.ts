import { VirtualFileSystem } from './virtualFs';

export interface TerminalSession {
  id: string;
  title: string;
  shell: 'bash' | 'zsh' | 'powershell' | 'cmd';
  cwd: string;
  logs: Array<{
    type: 'input' | 'stdout' | 'stderr' | 'system';
    text: string;
    timestamp: string;
    exitCode?: number;
  }>;
  history: string[];
  historyIndex: number;
  isRunning: boolean;
  currentCommand?: string;
  currentExecutionId?: string;
  startTime: number;
}

export interface TerminalSettings {
  defaultShell: 'bash' | 'zsh' | 'powershell' | 'cmd';
  fontSize: number;
  cursorBlink: boolean;
  cursorStyle: 'block' | 'line' | 'underline';
  scrollbackLimit: number;
  theme: 'dark-default' | 'matrix' | 'dracula' | 'monokai';
}

export class TerminalService {
  private static readonly SESSIONS_KEY = 'nova_terminal_sessions_v2';
  private static readonly SETTINGS_KEY = 'nova_terminal_settings_v2';

  public static getHostPlatform(): 'linux' | 'darwin' | 'win32' {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('win')) return 'win32';
      if (ua.includes('mac')) return 'darwin';
    }
    return 'linux';
  }

  public static getDefaultShellForPlatform(): 'bash' | 'zsh' | 'powershell' | 'cmd' {
    const plat = this.getHostPlatform();
    if (plat === 'win32') return 'powershell';
    if (plat === 'darwin') return 'zsh';
    return 'bash';
  }

  public static loadSettings(): TerminalSettings {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      defaultShell: this.getDefaultShellForPlatform(),
      fontSize: 12,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollbackLimit: 1000,
      theme: 'dark-default',
    };
  }

  public static saveSettings(settings: TerminalSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save terminal settings', e);
    }
  }

  public static createDefaultSession(cwd: string = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '/workspace'): TerminalSession {
    const shell = this.getDefaultShellForPlatform();
    return {
      id: `term-${Date.now()}`,
      title: `${shell} 1`,
      shell,
      cwd,
      logs: [
        {
          type: 'system',
          text: `Vertex Forge Interactive Terminal v2.4 (${shell}) [Connected to workspace: ${cwd}]`,
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          type: 'system',
          text: `Type commands like 'npm test', 'npm run dev', 'git status', 'ls -la', or use quick actions.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      history: [],
      historyIndex: -1,
      isRunning: false,
      startTime: Date.now(),
    };
  }

  // Execute Command in Session with Real Process Runner
  public static async executeCommand(
    session: TerminalSession,
    command: string,
    vfs?: VirtualFileSystem,
    onLogUpdate?: (session: TerminalSession) => void
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const trimmed = command.trim();
    if (!trimmed) return { stdout: '', stderr: '', exitCode: 0 };

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Update history and session state
    session.history.push(trimmed);
    session.historyIndex = -1;
    session.isRunning = true;
    session.currentCommand = trimmed;
    session.currentExecutionId = executionId;

    // Log the input
    session.logs.push({
      type: 'input',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    });
    onLogUpdate?.(session);

    // Handle internal shell commands
    if (trimmed === 'clear') {
      session.logs = [];
      session.isRunning = false;
      session.currentCommand = undefined;
      session.currentExecutionId = undefined;
      onLogUpdate?.(session);
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    if (trimmed === 'pwd') {
      session.logs.push({
        type: 'stdout',
        text: session.cwd,
        timestamp: new Date().toLocaleTimeString(),
        exitCode: 0,
      });
      session.isRunning = false;
      session.currentCommand = undefined;
      session.currentExecutionId = undefined;
      onLogUpdate?.(session);
      return { stdout: session.cwd, stderr: '', exitCode: 0 };
    }

    if (trimmed.startsWith('cd ')) {
      const targetDir = trimmed.slice(3).trim();
      session.cwd = targetDir === '..' ? session.cwd.split('/').slice(0, -1).join('/') || '/' : `${session.cwd}/${targetDir}`.replace(/\/+/g, '/');
      session.logs.push({
        type: 'stdout',
        text: `Directory changed to: ${session.cwd}`,
        timestamp: new Date().toLocaleTimeString(),
        exitCode: 0,
      });
      session.isRunning = false;
      session.currentCommand = undefined;
      session.currentExecutionId = undefined;
      onLogUpdate?.(session);
      return { stdout: `Directory changed to: ${session.cwd}`, stderr: '', exitCode: 0 };
    }

    // Call real backend execution endpoint
    try {
      const res = await fetch('/api/process/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed, cwd: session.cwd, executionId }),
      });

      if (res.ok) {
        const data = await res.json();
        let loggedAny = false;

        if (data.stdout && data.stdout.trim()) {
          session.logs.push({
            type: 'stdout',
            text: data.stdout.trimEnd(),
            timestamp: new Date().toLocaleTimeString(),
            exitCode: data.exitCode,
          });
          loggedAny = true;
        }

        if (data.stderr && data.stderr.trim()) {
          session.logs.push({
            type: 'stderr',
            text: data.stderr.trimEnd(),
            timestamp: new Date().toLocaleTimeString(),
            exitCode: data.exitCode,
          });
          loggedAny = true;
        }

        // Clean completion for commands with no stdout/stderr (e.g., touch, mkdir, rm)
        if (!loggedAny) {
          if (data.exitCode === 0) {
            session.logs.push({
              type: 'system',
              text: `[Command completed successfully with exit code 0]`,
              timestamp: new Date().toLocaleTimeString(),
              exitCode: 0,
            });
          } else {
            session.logs.push({
              type: 'stderr',
              text: `[Command exited with error code ${data.exitCode}]`,
              timestamp: new Date().toLocaleTimeString(),
              exitCode: data.exitCode,
            });
          }
        }

        session.isRunning = false;
        session.currentCommand = undefined;
        session.currentExecutionId = undefined;
        onLogUpdate?.(session);
        return {
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          exitCode: data.exitCode ?? 0,
        };
      }
    } catch (err: any) {
      session.logs.push({
        type: 'stderr',
        text: `[Process Execution Failed]: Could not reach backend server at /api/process/execute (${err?.message || 'Network Error'}). Ensure NovaIDE server is active.`,
        timestamp: new Date().toLocaleTimeString(),
        exitCode: 1,
      });
      session.isRunning = false;
      session.currentCommand = undefined;
      session.currentExecutionId = undefined;
      onLogUpdate?.(session);
      return { stdout: '', stderr: err?.message || 'Execution failed', exitCode: 1 };
    }

    session.isRunning = false;
    session.currentCommand = undefined;
    session.currentExecutionId = undefined;
    onLogUpdate?.(session);
    return { stdout: '', stderr: 'Request failed', exitCode: 1 };
  }

  // Interrupt currently running command in session (Ctrl+C)
  public static async interruptCommand(
    session: TerminalSession,
    onLogUpdate?: (session: TerminalSession) => void
  ): Promise<boolean> {
    if (!session.isRunning && !session.currentExecutionId) return false;

    const execId = session.currentExecutionId;
    session.logs.push({
      type: 'stderr',
      text: '^C [Process interrupted by user]',
      timestamp: new Date().toLocaleTimeString(),
      exitCode: 130,
    });
    session.isRunning = false;
    session.currentCommand = undefined;
    session.currentExecutionId = undefined;
    onLogUpdate?.(session);

    if (execId) {
      try {
        await fetch('/api/process/interrupt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ executionId: execId }),
        });
      } catch {}
    }

    return true;
  }

  // Format error for sending to AI Assistant
  public static extractErrorContext(session: TerminalSession): string {
    const errLogs = session.logs.filter(l => l.type === 'stderr' || (l.exitCode && l.exitCode !== 0));
    if (errLogs.length === 0) {
      return `Terminal Session: ${session.title}\nWorking Directory: ${session.cwd}\nNo active errors found in recent output.`;
    }
    const latest = errLogs.slice(-3);
    return `Terminal Error in "${session.cwd}":\n` + latest.map(l => `[${l.timestamp}] ${l.text}`).join('\n');
  }
}

