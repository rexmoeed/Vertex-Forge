import { describe, it, expect, vi } from 'vitest';
import { AutonomousPlanGenerator } from '../autonomousPlanGenerator';
import { AutonomousVerificationService } from '../autonomousVerificationService';
import {
  generateUnifiedDiff,
  executeFileSearch,
  executeCreateFile,
  executePatchFile,
  executeDeleteFile,
  executeListDir,
} from '../agentFsTools';
import {
  executeTerminalCommand,
  executeServerLifecycle,
} from '../agentSystemTools';
import { VirtualFileSystem } from '../../virtualFs';
import { DesktopBridge } from '../../desktopBridge';

describe('Autonomous Plan & Verification Modules', () => {
  it('generates autonomous plan with fallback tasks', async () => {
    const vfs = new VirtualFileSystem([]);
    const toolRegistry: any = {
      executeTool: vi.fn().mockResolvedValue({ success: false }),
    };

    const plan = await AutonomousPlanGenerator.planGoal(
      'Build shopping cart component',
      vfs,
      toolRegistry,
      'autonomous',
      3
    );

    expect(plan.goal).toBe('Build shopping cart component');
    expect(plan.tasks.length).toBeGreaterThanOrEqual(2);
    expect(plan.status).toBe('draft');
  });

  it('runs verification suite via AutonomousVerificationService', async () => {
    const toolRegistry: any = {
      executeTool: vi.fn().mockImplementation((name: string) => {
        if (name === 'type_check') return Promise.resolve({ success: true });
        if (name === 'run_tests') return Promise.resolve({ success: true, data: { passed: 10, failed: 0 } });
        return Promise.resolve({ success: true });
      }),
    };

    const filesModified = new Set(['src/Cart.tsx', 'src/__tests__/Cart.test.tsx']);
    const commandsExecuted: any[] = [];

    const summary = await AutonomousVerificationService.runVerification(
      toolRegistry,
      filesModified,
      commandsExecuted
    );

    expect(summary.overallSuccess).toBe(true);
    expect(summary.filesChanged).toContain('src/Cart.tsx');
    expect(summary.testsPassed).toBe(10);
    expect(summary.typeCheckPassed).toBe(true);
  });

  describe('agentFsTools', () => {
    it('generates unified diff correctly', () => {
      const diff = generateUnifiedDiff('test.ts', 'line1\nline2', 'line1\nline2_modified');
      expect(diff).toContain('-line2');
      expect(diff).toContain('+line2_modified');

      const noChangeDiff = generateUnifiedDiff('test.ts', 'same', 'same');
      expect(noChangeDiff).toContain('No line changes');
    });

    it('creates, patches, searches, and deletes files via VFS tools', async () => {
      const vfs = new VirtualFileSystem([]);
      vi.spyOn(DesktopBridge, 'writeFile').mockResolvedValue(true as any);
      vi.spyOn(DesktopBridge, 'deletePath').mockResolvedValue(true as any);

      // Create file
      const createRes = await executeCreateFile(vfs, { filePath: 'src/main.ts', initialContent: 'const a = 1;' });
      expect(createRes.result.success).toBe(true);
      expect(vfs.readFile('src/main.ts')).toBe('const a = 1;');

      // Patch file
      const patchRes = await executePatchFile(vfs, {
        filePath: 'src/main.ts',
        targetString: 'const a = 1;',
        replacementString: 'const a = 2;',
      });
      expect(patchRes.result.success).toBe(true);
      expect(vfs.readFile('src/main.ts')).toBe('const a = 2;');

      // Search file
      const searchRes = await executeFileSearch(vfs, '/workspace', { query: 'const a' });
      expect(searchRes.success).toBe(true);

      // List dir
      const listRes = await executeListDir(vfs, { dirPath: '.' });
      expect(listRes.success).toBe(true);

      // Delete file
      const deleteRes = await executeDeleteFile(vfs, { filePath: 'src/main.ts' });
      expect(deleteRes.result.success).toBe(true);
      expect(vfs.readFile('src/main.ts')).toBeNull();
    });
  });

  describe('agentSystemTools', () => {
    it('executes terminal commands using DesktopBridge', async () => {
      vi.spyOn(DesktopBridge, 'executeCommand').mockResolvedValue({
        exitCode: 0,
        stdout: 'v20.0.0',
        stderr: '',
      } as any);

      const res = await executeTerminalCommand('/workspace', { command: 'node -v' });
      expect(res.success).toBe(true);
      expect(res.output).toContain('v20.0.0');

      const emptyRes = await executeTerminalCommand('/workspace', { command: '' });
      expect(emptyRes.success).toBe(false);
    });

    it('executes server lifecycle start/stop/status', async () => {
      vi.spyOn(DesktopBridge, 'startDevServer').mockResolvedValue({
        pid: 1234,
        port: 5173,
        url: 'http://localhost:5173',
        status: 'running',
      } as any);

      vi.spyOn(DesktopBridge, 'listDevServers').mockResolvedValue([
        { pid: 1234, port: 5173, status: 'running' },
      ] as any);

      vi.spyOn(DesktopBridge, 'stopDevServer').mockResolvedValue(true as any);

      const startRes = await executeServerLifecycle({ action: 'start', port: 5173 });
      expect(startRes.success).toBe(true);

      const statusRes = await executeServerLifecycle({ action: 'status' });
      expect(statusRes.success).toBe(true);

      const stopRes = await executeServerLifecycle({ action: 'stop', pid: 1234 });
      expect(stopRes.success).toBe(true);
    });
  });
});
