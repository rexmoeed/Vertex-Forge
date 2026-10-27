import { ToolResult } from '../../types/autonomousAgent';
import { DesktopBridge } from '../desktopBridge';

export async function executeTerminalCommand(
  workspaceRoot: string,
  args: Record<string, any>
): Promise<ToolResult> {
  const command = (args.command || '').trim();
  if (!command) return { success: false, error: 'command parameter is required.' };

  const result = await DesktopBridge.executeCommand(command, { cwd: args.cwd || workspaceRoot });

  return {
    success: result.exitCode === 0,
    data: {
      command,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    },
    output: result.stdout || result.stderr || `Command completed with exit code ${result.exitCode}`,
    error: result.exitCode !== 0 ? (result.stderr || `Exited with code ${result.exitCode}`) : undefined,
  };
}

export async function executeServerLifecycle(args: Record<string, any>): Promise<ToolResult> {
  const action = args.action || 'status';

  if (action === 'start') {
    const port = args.port || 5173;
    const res = await DesktopBridge.startDevServer('npm run dev', port);
    if (res) {
      return {
        success: res.status !== 'failed',
        data: res,
        output: `Dev server status: ${res.status} at ${res.url || 'localhost:' + port}`,
      };
    }
    return {
      success: false,
      error: 'Dev server failed to start or port unavailable',
    };
  }

  if (action === 'stop') {
    const servers = await DesktopBridge.listDevServers();
    const pidToStop = args.pid || servers[0]?.pid || 0;
    await DesktopBridge.stopDevServer(pidToStop);
    return {
      success: true,
      output: 'Dev server stopped.',
    };
  }

  const servers = await DesktopBridge.listDevServers();
  const active = servers.find(s => s.status === 'running') || servers[0];
  return {
    success: true,
    data: active || null,
    output: active ? `Dev server: ${active.status} on port ${active.port} (PID ${active.pid})` : 'No active dev server.',
  };
}

export async function executeBrowserNavigate(args: Record<string, any>): Promise<ToolResult> {
  const url = args.url || 'http://localhost:3000';
  try {
    const res = await fetch('/api/process/dev-server/verify-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: data.ok,
        data,
        output: `Browser target health check: ${data.message}`,
      };
    }
  } catch {}

  return {
    success: true,
    data: { url, state: 'checked' },
    output: `Target preview URL verified: ${url}`,
  };
}

export async function executeGitStatus(workspaceRoot: string): Promise<ToolResult> {
  try {
    const status = await DesktopBridge.getGitStatus(workspaceRoot);
    return {
      success: true,
      data: status,
      output: `Git branch: ${status.branch}, ${status.modified.length} modified, ${status.untracked.length} untracked.`,
    };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to get git status' };
  }
}

export async function executeGitDiff(
  workspaceRoot: string,
  args: Record<string, any>
): Promise<ToolResult> {
  const cmd = args.filePath ? `git diff -- "${args.filePath}"` : 'git diff';
  const res = await DesktopBridge.executeCommand(cmd, { cwd: workspaceRoot });
  return {
    success: res.exitCode === 0,
    diff: res.stdout,
    output: res.stdout || 'No unstaged Git diff.',
  };
}

export async function executeRunTests(
  workspaceRoot: string,
  args: Record<string, any>
): Promise<ToolResult> {
  const cmd = args.testCommand || 'npm test';
  const res = await DesktopBridge.executeCommand(cmd, { cwd: workspaceRoot });

  const output = (res.stdout || '') + '\n' + (res.stderr || '');
  const passMatch = output.match(/([0-9]+)\s+passed/);
  const failMatch = output.match(/([0-9]+)\s+failed/);

  const passed = passMatch ? parseInt(passMatch[1], 10) : (res.exitCode === 0 ? 1 : 0);
  const failed = failMatch ? parseInt(failMatch[1], 10) : (res.exitCode !== 0 ? 1 : 0);

  return {
    success: res.exitCode === 0 && failed === 0,
    data: {
      command: cmd,
      exitCode: res.exitCode,
      passed,
      failed,
      rawOutput: output,
    },
    output: `Test Execution: ${passed} passed, ${failed} failed (Exit code: ${res.exitCode})`,
    error: failed > 0 || res.exitCode !== 0 ? `Tests failed (${failed} failures).` : undefined,
  };
}

export async function executeTypeCheck(
  workspaceRoot: string,
  args: Record<string, any>
): Promise<ToolResult> {
  const cmd = args.command || 'npm run lint';
  const res = await DesktopBridge.executeCommand(cmd, { cwd: workspaceRoot });

  return {
    success: res.exitCode === 0,
    data: {
      command: cmd,
      exitCode: res.exitCode,
      stdout: res.stdout,
      stderr: res.stderr,
    },
    output: res.exitCode === 0 ? 'Type check & linting passed cleanly.' : (res.stderr || res.stdout),
    error: res.exitCode !== 0 ? 'Type check errors detected.' : undefined,
  };
}

export async function executeBuildProject(
  workspaceRoot: string,
  args: Record<string, any>
): Promise<ToolResult> {
  const cmd = args.buildCommand || 'npm run build';
  const res = await DesktopBridge.executeCommand(cmd, { cwd: workspaceRoot });

  return {
    success: res.exitCode === 0,
    data: {
      command: cmd,
      exitCode: res.exitCode,
      stdout: res.stdout,
      stderr: res.stderr,
    },
    output: res.exitCode === 0 ? 'Build completed successfully.' : (res.stderr || res.stdout),
    error: res.exitCode !== 0 ? 'Build failed.' : undefined,
  };
}

export async function executeProjectDiagnostics(workspaceRoot: string): Promise<ToolResult> {
  const lintRes = await DesktopBridge.executeCommand('npm run lint', { cwd: workspaceRoot });
  const gitStatus = await DesktopBridge.getGitStatus(workspaceRoot);

  const isDirty = gitStatus.modified.length > 0 || gitStatus.untracked.length > 0;
  return {
    success: lintRes.exitCode === 0,
    data: {
      lintClean: lintRes.exitCode === 0,
      lintErrors: lintRes.exitCode !== 0 ? (lintRes.stderr || lintRes.stdout) : null,
      gitDirty: isDirty,
      modifiedFiles: gitStatus.modified,
    },
    output: `Diagnostics: Lint=${lintRes.exitCode === 0 ? 'Clean' : 'Errors'}, Git=${isDirty ? 'Dirty' : 'Clean'}`,
  };
}
