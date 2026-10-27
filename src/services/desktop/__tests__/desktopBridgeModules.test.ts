import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesktopProcessBridge } from '../desktopProcessBridge';
import { DesktopGitBridge } from '../desktopGitBridge';
import { VirtualFileSystem } from '../../virtualFs';

describe('Desktop Bridge Submodules', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles backend command execution via DesktopProcessBridge', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stdout: 'v20.10.0',
        stderr: '',
        exitCode: 0,
        durationMs: 45,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await DesktopProcessBridge.executeCommand('node -v', '/app');
    expect(result.stdout).toBe('v20.10.0');
    expect(result.exitCode).toBe(0);
  });

  it('falls back gracefully on network error during executeCommand', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await DesktopProcessBridge.executeCommand('ls', '/app');
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Failed to reach execution backend');
  });

  it('retrieves git status via DesktopGitBridge using VFS fallback', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const vfs = new VirtualFileSystem([
      { id: '1', name: 'app.ts', path: 'src/app.ts', type: 'file', content: 'const a = 1;' },
    ]);

    const status = await DesktopGitBridge.getGitStatus('/app', '/app', vfs);
    expect(status.isRepo).toBe(true);
    expect(status.branch).toBe('main');
  });
});
