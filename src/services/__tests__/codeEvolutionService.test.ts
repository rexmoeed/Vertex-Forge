import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConcreteCodeEvolutionService } from '../codeEvolutionService';
import { VirtualFileSystem } from '../virtualFs';
import { DesktopBridge } from '../desktopBridge';

describe('ConcreteCodeEvolutionService', () => {
  let service: ConcreteCodeEvolutionService;
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem([]);
    vfs.writeFile('src/App.tsx', 'export const App = () => null;');
    service = new ConcreteCodeEvolutionService(vfs);
    vi.restoreAllMocks();
  });

  it('analyzes code evolution and generates complete map with stats', async () => {
    vi.spyOn(DesktopBridge, 'executeCommand').mockResolvedValue({
      exitCode: 0,
      stdout:
        'c1a2b3c|c1a2b3c|Dev Engineer|1730000000|feat: initial setup\n10\t2\tsrc/App.tsx\n\nc2d3e4f|c2d3e4f|Dev Engineer|1730003600|fix: resolve crash\n5\t1\tsrc/App.tsx\n',
      stderr: '',
      durationMs: 15,
    });

    const map = await service.analyze({
      workspaceId: 'test-workspace',
      branch: 'main',
    });

    expect(map.workspaceId).toBe('test-workspace');
    expect(map.commits.length).toBeGreaterThan(0);
    expect(map.files.length).toBeGreaterThan(0);
    expect(map.statistics.totalCommits).toBeGreaterThan(0);
    expect(map.statistics.weeklyChurn).toBeGreaterThan(0);
  });

  it('falls back to VFS commits when git execution is unavailable', async () => {
    vi.spyOn(DesktopBridge, 'executeCommand').mockRejectedValue(new Error('Git not available'));

    vfs.commit('Initial VFS commit');

    const map = await service.analyze({
      workspaceId: 'vfs-workspace',
    });

    expect(map.commits.length).toBeGreaterThan(0);
    expect(map.statistics.totalFiles).toBeDefined();
  });

  it('caches analysis results by workspace and branch key', async () => {
    const spy = vi.spyOn(DesktopBridge, 'executeCommand').mockResolvedValue({
      exitCode: 0,
      stdout: 'c1a2b3c|c1a2b3c|Dev Engineer|1730000000|feat: test\n1\t1\tfile.ts\n',
      stderr: '',
      durationMs: 12,
    });

    const map1 = await service.analyze({ workspaceId: 'cached-ws', branch: 'feat' });
    const map2 = await service.analyze({ workspaceId: 'cached-ws', branch: 'feat' });

    expect(map1).toBe(map2);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
