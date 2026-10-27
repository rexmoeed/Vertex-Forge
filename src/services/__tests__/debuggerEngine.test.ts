import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DebuggerEngine } from '../debuggerEngine';
import { VirtualFileSystem } from '../virtualFs';
import { DesktopBridge } from '../desktopBridge';

vi.mock('../desktopBridge', () => ({
  DesktopBridge: {
    executeCommand: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../geminiService', () => ({
  GeminiService: {
    diagnoseBug: vi.fn().mockResolvedValue('Suggested fix: check array length before computing average'),
  },
}));

describe('DebuggerEngine - Multi-Language Debugger & DAP Adapter', () => {
  let vfs: VirtualFileSystem;
  let engine: DebuggerEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    vfs = new VirtualFileSystem([
      {
        id: '1',
        name: 'sampleDebugTarget.ts',
        path: 'src/services/sampleDebugTarget.ts',
        type: 'file',
        content: 'export function computeInventoryAverages(prices: number[]) { return { total: 0 }; }',
      },
    ]);
  });

  describe('Runtime Discovery (Success & Failure Branches)', () => {
    it('discovers available runtimes when CLI tools respond with exit code 0', async () => {
      vi.mocked(DesktopBridge.executeCommand).mockImplementation(async (cmd: string) => {
        if (cmd.includes('node -v')) return { exitCode: 0, stdout: 'v22.0.0', stderr: '', durationMs: 10 };
        if (cmd.includes('python3 --version')) return { exitCode: 0, stdout: 'Python 3.12.0', stderr: '', durationMs: 10 };
        return { exitCode: 1, stdout: '', stderr: 'command not found', durationMs: 10 };
      });

      engine = new DebuggerEngine(vfs);
      const runtimes = await engine.discoverRuntimes();

      expect(runtimes.length).toBeGreaterThan(0);
      const nodeRuntime = runtimes.find(r => r.runtime === 'Node.js');
      expect(nodeRuntime?.isAvailable).toBe(true);

      const pythonRuntime = runtimes.find(r => r.runtime === 'Python 3');
      expect(pythonRuntime?.isAvailable).toBe(true);
    });

    it('handles failure branches when CLI tools are not installed or error out', async () => {
      vi.mocked(DesktopBridge.executeCommand).mockRejectedValue(new Error('Process execution failed'));

      engine = new DebuggerEngine(vfs);
      const runtimes = await engine.discoverRuntimes();

      expect(runtimes.length).toBeGreaterThan(0);
      for (const r of runtimes) {
        expect(r.isAvailable).toBe(false);
      }
    });
  });

  describe('Breakpoint Toggling & Management', () => {
    it('toggles breakpoints on and off on specific lines', () => {
      vi.mocked(DesktopBridge.executeCommand).mockResolvedValue({ exitCode: 0, stdout: 'v22.0.0', stderr: '', durationMs: 10 });
      engine = new DebuggerEngine(vfs);

      const added = engine.toggleBreakpoint('src/services/sampleDebugTarget.ts', 15);
      expect(added).toBe(true);
      expect(engine.getBreakpoints().length).toBe(1);
      expect(engine.getBreakpoints()[0].line).toBe(15);

      // Toggling the same line again removes it
      const removed = engine.toggleBreakpoint('src/services/sampleDebugTarget.ts', 15);
      expect(removed).toBe(false);
      expect(engine.getBreakpoints().length).toBe(0);
    });

    it('sets and clears individual breakpoints', () => {
      vi.mocked(DesktopBridge.executeCommand).mockResolvedValue({ exitCode: 0, stdout: 'v22.0.0', stderr: '', durationMs: 10 });
      engine = new DebuggerEngine(vfs);

      const bp = engine.setBreakpoint('src/services/sampleDebugTarget.ts', 10, 'i > 5');
      expect(bp.line).toBe(10);
      expect(bp.condition).toBe('i > 5');
      expect(engine.getBreakpoints().length).toBe(1);

      engine.clearAllBreakpoints();
      expect(engine.getBreakpoints().length).toBe(0);
    });
  });

  describe('Debugging Sessions & Stepping', () => {
    it('starts and stops debug sessions gracefully', async () => {
      vi.mocked(DesktopBridge.executeCommand).mockResolvedValue({ exitCode: 0, stdout: 'v22.0.0', stderr: '', durationMs: 10 });
      engine = new DebuggerEngine(vfs);

      const session = await engine.startSession('Debug Sample Program (sampleDebugTarget.ts)');
      expect(session).toBeDefined();
      expect(session.name).toContain('sampleDebugTarget');

      engine.stopSession();
      expect(engine.getCurrentSession()).toBeNull();
    });

    it('evaluates watch expressions', () => {
      vi.mocked(DesktopBridge.executeCommand).mockResolvedValue({ exitCode: 0, stdout: 'v22.0.0', stderr: '', durationMs: 10 });
      engine = new DebuggerEngine(vfs);

      const expr = engine.addWatchExpression('total');
      expect(expr.expression).toBe('total');
      expect(engine.getWatchExpressions().length).toBe(1);
    });
  });
});
