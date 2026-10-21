import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GitProvider, useGit } from '../GitContext';
import { DesktopBridge } from '../../services/desktopBridge';

vi.mock('../../services/desktopBridge', () => ({
  DesktopBridge: {
    currentWorkspacePath: '/test/repo',
    getGitStatus: vi.fn(),
    executeCommand: vi.fn(),
    gitClone: vi.fn(),
  },
}));

vi.mock('../../services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('GitContext & GitProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if useGit is used outside of GitProvider', () => {
    expect(() => renderHook(() => useGit())).toThrow('useGit must be used within a GitProvider');
  });

  it('initializes with default state or provided profile', () => {
    const { result } = renderHook(() => useGit(), {
      wrapper: ({ children }) => <GitProvider initialProfile={{ isRepo: true, branch: 'develop' } as any}>{children}</GitProvider>,
    });

    expect(result.current.gitProfile?.branch).toBe('develop');
    expect(result.current.isCloneModalOpen).toBe(false);
    expect(result.current.isRefreshingGit).toBe(false);
  });

  it('updates modal open state via setIsCloneModalOpen', () => {
    const { result } = renderHook(() => useGit(), {
      wrapper: ({ children }) => <GitProvider>{children}</GitProvider>,
    });

    act(() => {
      result.current.setIsCloneModalOpen(true);
    });

    expect(result.current.isCloneModalOpen).toBe(true);
  });

  it('refreshes git status and updates profile', async () => {
    vi.mocked(DesktopBridge.getGitStatus).mockResolvedValueOnce({
      isRepo: true,
      branch: 'feature/auth',
      ahead: 2,
      behind: 0,
      modifiedCount: 1,
      stagedCount: 0,
      untrackedCount: 3,
      lastCommit: { hash: 'abc1234', message: 'Add auth' },
    } as any);

    const { result } = renderHook(() => useGit(), {
      wrapper: ({ children }) => <GitProvider>{children}</GitProvider>,
    });

    await act(async () => {
      const profile = await result.current.refreshGit();
      expect(profile?.branch).toBe('feature/auth');
      expect(profile?.ahead).toBe(2);
    });

    expect(result.current.gitProfile?.branch).toBe('feature/auth');
    expect(DesktopBridge.getGitStatus).toHaveBeenCalledWith('/test/repo');
  });

  it('stages a file and refreshes status', async () => {
    vi.mocked(DesktopBridge.executeCommand).mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '', durationMs: 10 });
    vi.mocked(DesktopBridge.getGitStatus).mockResolvedValueOnce({ isRepo: true, branch: 'main' } as any);

    const onLog = vi.fn();
    const { result } = renderHook(() => useGit(), {
      wrapper: ({ children }) => <GitProvider onLogAction={onLog}>{children}</GitProvider>,
    });

    await act(async () => {
      await result.current.stageFile('src/index.ts');
    });

    expect(DesktopBridge.executeCommand).toHaveBeenCalledWith('git add "src/index.ts"');
    expect(onLog).toHaveBeenCalledWith('Staged file: src/index.ts', 'info');
  });

  it('commits changes and triggers refresh', async () => {
    vi.mocked(DesktopBridge.executeCommand).mockResolvedValueOnce({ exitCode: 0, stdout: 'feat: add login', stderr: '', durationMs: 10 });
    vi.mocked(DesktopBridge.getGitStatus).mockResolvedValueOnce({ isRepo: true, branch: 'main' } as any);

    const onLog = vi.fn();
    const { result } = renderHook(() => useGit(), {
      wrapper: ({ children }) => <GitProvider onLogAction={onLog}>{children}</GitProvider>,
    });

    let commitResult;
    await act(async () => {
      commitResult = await result.current.commitChanges('feat: add login');
    });

    expect(commitResult).toEqual({ success: true, hash: 'feat: a' });
    expect(DesktopBridge.executeCommand).toHaveBeenCalledWith('git commit -m "feat: add login"');
  });

  it('reverts file via git checkout', async () => {
    vi.mocked(DesktopBridge.executeCommand).mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '', durationMs: 10 });
    vi.mocked(DesktopBridge.getGitStatus).mockResolvedValueOnce({ isRepo: true, branch: 'main' } as any);

    const onLog = vi.fn();
    const { result } = renderHook(() => useGit(), {
      wrapper: ({ children }) => <GitProvider onLogAction={onLog}>{children}</GitProvider>,
    });

    await act(async () => {
      await result.current.revertFile('src/old.ts');
    });

    expect(DesktopBridge.executeCommand).toHaveBeenCalledWith('git checkout -- "src/old.ts"');
    expect(onLog).toHaveBeenCalledWith('Reverted file: src/old.ts', 'warning');
  });

  it('clones a repository successfully', async () => {
    vi.mocked(DesktopBridge.gitClone).mockResolvedValueOnce({
      success: true,
      targetPath: '/path/to/cloned',
    });

    const onLog = vi.fn();
    const { result } = renderHook(() => useGit(), {
      wrapper: ({ children }) => <GitProvider onLogAction={onLog}>{children}</GitProvider>,
    });

    let cloneRes;
    await act(async () => {
      cloneRes = await result.current.cloneRepository('https://github.com/foo/bar.git');
    });

    expect(cloneRes).toEqual({ success: true, targetPath: '/path/to/cloned' });
    expect(onLog).toHaveBeenCalledWith('Cloned repository into /path/to/cloned', 'success');
  });
});
