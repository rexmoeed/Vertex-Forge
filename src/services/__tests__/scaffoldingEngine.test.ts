import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScaffoldingEngine } from '../scaffoldingEngine';
import { DesktopBridge } from '../desktopBridge';
import { ScaffoldingContext, PlannedFileItem } from '../../types/scaffolding';

describe('ScaffoldingEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateProjectTarget', () => {
    it('rejects invalid project names', async () => {
      const res = await ScaffoldingEngine.validateProjectTarget('/my/projects', 'con');
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('rejects empty parent directory', async () => {
      const res = await ScaffoldingEngine.validateProjectTarget('   ', 'valid-project');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Destination location cannot be empty');
    });

    it('accepts clean new project target when directory does not exist', async () => {
      vi.spyOn(DesktopBridge, 'inspectPath').mockResolvedValue({
        exists: false,
        isDirectory: false,
        isFile: false,
        isEmpty: true,
        itemCount: 0,
        resolvedPath: '/my/projects/my-new-app',
        parentExists: true,
      });

      const res = await ScaffoldingEngine.validateProjectTarget('/my/projects', 'my-new-app');
      expect(res.valid).toBe(true);
      expect(res.exists).toBe(false);
      expect(res.resolvedPath).toBe('/my/projects/my-new-app');
    });

    it('warns when existing directory is empty and allows proceeding', async () => {
      vi.spyOn(DesktopBridge, 'inspectPath').mockResolvedValue({
        exists: true,
        isDirectory: true,
        isFile: false,
        isEmpty: true,
        itemCount: 0,
        resolvedPath: '/my/projects/empty-dir',
        parentExists: true,
      });

      const res = await ScaffoldingEngine.validateProjectTarget('/my/projects', 'empty-dir');
      expect(res.valid).toBe(true);
      expect(res.exists).toBe(true);
      expect(res.isEmpty).toBe(true);
      expect(res.warning).toContain('exists but is empty');
    });

    it('rejects target when directory exists and is non-empty', async () => {
      vi.spyOn(DesktopBridge, 'inspectPath').mockResolvedValue({
        exists: true,
        isDirectory: true,
        isFile: false,
        isEmpty: false,
        itemCount: 12,
        resolvedPath: '/my/projects/existing-app',
        parentExists: true,
      });

      const res = await ScaffoldingEngine.validateProjectTarget('/my/projects', 'existing-app');
      expect(res.valid).toBe(false);
      expect(res.exists).toBe(true);
      expect(res.isEmpty).toBe(false);
      expect(res.error).toContain('already exists and contains 12 items');
    });
  });

  describe('executeCreation', () => {
    const ctx: ScaffoldingContext = {
      projectName: 'test-app',
      projectDescription: 'Test starter application',
      parentDir: '/projects',
      destinationPath: '/projects/test-app',
      templateId: 'react-vite-ts',
      category: 'web',
      architecture: 'modular',
      packageManager: 'npm',
      initGit: true,
      selectedLibraries: [],
    };

    const files: PlannedFileItem[] = [
      { id: 'f1', path: 'package.json', content: '{"name": "test-app"}', description: 'Manifest' },
      { id: 'f2', path: 'src/main.tsx', content: 'console.log("main")', description: 'Entry point' },
      { id: 'f3', path: 'src/components/Header.tsx', content: 'export const Header = () => null;', description: 'Header component' },
    ];

    it('scaffolds folders and files successfully', async () => {
      vi.spyOn(DesktopBridge, 'inspectPath').mockResolvedValue({
        exists: false,
        isDirectory: false,
        isFile: false,
        isEmpty: true,
        itemCount: 0,
        resolvedPath: '/projects/test-app',
        parentExists: true,
      });
      const createDirSpy = vi.spyOn(DesktopBridge, 'createDirectory').mockResolvedValue({ success: true } as any);
      const writeFileSpy = vi.spyOn(DesktopBridge, 'writeFile').mockResolvedValue({ success: true } as any);
      const execSpy = vi.spyOn(DesktopBridge, 'executeCommand').mockResolvedValue({
        exitCode: 0,
        stdout: 'Done',
        stderr: '',
        durationMs: 20,
      });

      const progressLogs: any[] = [];
      const res = await ScaffoldingEngine.executeCreation(ctx, files, (p, log, s) => {
        progressLogs.push({ p, log, s });
      });

      expect(res.success).toBe(true);
      expect(res.createdFilesCount).toBe(3);
      expect(res.gitInitialized).toBe(true);
      expect(res.dependenciesInstalled).toBe(true);
      expect(createDirSpy).toHaveBeenCalled();
      expect(writeFileSpy).toHaveBeenCalledTimes(3);
      expect(execSpy).toHaveBeenCalledWith('git init', expect.any(Object));
      expect(progressLogs.length).toBeGreaterThan(0);
    });

    it('handles validation failure gracefully and reports error in result', async () => {
      vi.spyOn(DesktopBridge, 'inspectPath').mockResolvedValue({
        exists: true,
        isDirectory: true,
        isFile: false,
        isEmpty: false,
        itemCount: 5,
        resolvedPath: '/projects/test-app',
        parentExists: true,
      });

      const res = await ScaffoldingEngine.executeCreation(ctx, files);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.logs.some(l => l.type === 'error')).toBe(true);
    });
  });
});
