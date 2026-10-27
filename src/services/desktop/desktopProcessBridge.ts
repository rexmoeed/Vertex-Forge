import { CommandExecutionResult } from '../../types/desktop';
import { DevServerProcess } from '../../types/project';
import { logger } from '../logger';

export class DesktopProcessBridge {
  public static async executeCommand(
    command: string,
    currentWorkspacePath: string,
    options?: { cwd?: string; timeoutMs?: number; env?: Record<string, string>; executionId?: string }
  ): Promise<CommandExecutionResult> {
    const cwd = options?.cwd || currentWorkspacePath;
    try {
      const res = await fetch('/api/process/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, cwd, executionId: options?.executionId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return {
        stdout: '',
        stderr: `[Process Runner Error]: Failed to reach execution backend: ${msg}`,
        exitCode: 1,
        durationMs: 0,
      };
    }

    return {
      stdout: '',
      stderr: `[Process Runner Error]: Execution request failed`,
      exitCode: 1,
      durationMs: 0,
    };
  }

  public static async interruptCommand(executionId?: string, pid?: number): Promise<boolean> {
    try {
      const res = await fetch('/api/process/interrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId, pid }),
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.success;
      }
    } catch {
      // ignore
    }
    return false;
  }

  public static async startDevServer(
    command: string,
    currentWorkspacePath: string,
    cwd?: string,
    port = 5173
  ): Promise<DevServerProcess | null> {
    try {
      const res = await fetch('/api/process/dev-server/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, cwd: cwd || currentWorkspacePath, port }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: unknown) {
      logger.error('Failed to start dev server:', e);
    }
    return null;
  }

  public static async checkDevServerHealth(
    pid: number
  ): Promise<{ isAlive: boolean; isReady: boolean; status: string; healthState: string; statusCode?: number; message?: string }> {
    try {
      const res = await fetch(`/api/process/dev-server/health?pid=${pid}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { isAlive: false, isReady: false, status: 'stopped', healthState: 'stopped', message: 'Unable to connect to health checker' };
  }

  public static async stopDevServer(pid: number): Promise<boolean> {
    try {
      const res = await fetch('/api/process/dev-server/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async listDevServers(): Promise<DevServerProcess[]> {
    try {
      const res = await fetch('/api/process/dev-server/list');
      if (res.ok) {
        const data = await res.json();
        return data.servers || [];
      }
    } catch {
      // ignore
    }
    return [];
  }
}
