import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IDEBuildRunner } from '../ideBuildRunner';
import { DesktopBridge } from '../desktopBridge';
import { TerminalRunner } from '../terminalRunner';
import { VirtualFileSystem } from '../virtualFs';
import { GeminiService } from '../geminiService';

vi.mock('../desktopBridge', () => ({
  DesktopBridge: {
    currentWorkspacePath: '/test/workspace',
    executeCommand: vi.fn(),
    startDevServer: vi.fn(),
    stopDevServer: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(true),
    readFile: vi.fn().mockResolvedValue('export const a = 1;'),
  },
}));

vi.mock('../geminiService', () => ({
  GeminiService: {
    debugIssue: vi.fn().mockResolvedValue({
      rootCause: 'Variable mismatch',
      explanation: 'Fixed variable typing',
      patch: 'export const a = 2;',
    }),
  },
}));

describe('IDEBuildRunner', () => {
  let vfs: VirtualFileSystem;
  let runner: TerminalRunner;

  beforeEach(() => {
    vfs = new VirtualFileSystem([
      { id: '1', name: 'App.tsx', path: 'src/App.tsx', type: 'file', content: 'const x = 1;' },
    ]);
    runner = new TerminalRunner(vfs);
    vi.clearAllMocks();
  });

  it('executes a command through DesktopBridge and returns terminal lines', async () => {
    vi.mocked(DesktopBridge.executeCommand).mockResolvedValueOnce({
      exitCode: 0,
      stdout: 'Command output line',
      stderr: '',
      durationMs: 15,
    });

    const lines = await IDEBuildRunner.executeCommand('echo test', runner);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.some(l => l.text.includes('Command output line'))).toBe(true);
    expect(lines.some(l => l.text.includes('Process completed with exit code 0'))).toBe(true);
  });

  it('runs tests and parses test results', async () => {
    vi.mocked(DesktopBridge.executeCommand).mockResolvedValueOnce({
      exitCode: 0,
      stdout: '✓ Suite > test passes cleanly\nTests 1 passed',
      stderr: '',
      durationMs: 100,
    });

    const res = await IDEBuildRunner.runTests(runner, 'src/App.tsx');
    expect(res.passed).toBe(true);
    expect(res.exitCode).toBe(0);
    expect(res.testResults.length).toBeGreaterThan(0);
  });

  it('runs project build and reports diagnostics on failure', async () => {
    vi.mocked(DesktopBridge.executeCommand).mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'TS2304: Cannot find name "foo"',
      durationMs: 250,
    });

    const res = await IDEBuildRunner.runBuild(null, 'src/App.tsx');
    expect(res.success).toBe(false);
    expect(res.exitCode).toBe(1);
    expect(res.diagnostic).toBeDefined();
    expect(res.diagnostic?.message).toContain('TS2304');
  });

  it('runs lint using fallback runner', () => {
    const res = IDEBuildRunner.runLint(runner);
    expect(res.lines).toBeDefined();
    expect(res.diagnostics).toBeDefined();
  });

  it('executes self healing loop with Gemini patch and vfs update', async () => {
    const onLog = vi.fn();
    const result = await IDEBuildRunner.executeSelfHeal({
      failingFile: 'src/App.tsx',
      errorStack: 'ReferenceError: a is not defined',
      vfs,
      onLog,
    });

    expect(result.success).toBe(true);
    expect(result.patch).toBe('export const a = 2;');
    expect(vfs.readFile('src/App.tsx')).toBe('export const a = 2;');
    expect(onLog).toHaveBeenCalled();
  });

  it('manages dev server start and stop', async () => {
    vi.mocked(DesktopBridge.startDevServer).mockResolvedValueOnce({
      pid: 1234,
      port: 3000,
      command: 'npm run dev',
      status: 'running',
      cwd: '/test',
      startTime: Date.now(),
      url: 'http://localhost:3000',
      logs: [],
    });

    const server = await IDEBuildRunner.startDevServer(null);
    expect(server?.port).toBe(3000);
    expect(server?.pid).toBe(1234);

    await IDEBuildRunner.stopDevServer(server);
    expect(DesktopBridge.stopDevServer).toHaveBeenCalledWith(1234);
  });
});
