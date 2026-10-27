import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGitHubWorkflow } from '../useGitHubWorkflow';
import { useGitBranchStashWorkflow } from '../useGitBranchStashWorkflow';
import { GitWorkflowService } from '../../../../services/gitWorkflowService';

vi.mock('../../../../services/gitWorkflowService', () => ({
  GitWorkflowService: {
    setGitHubToken: vi.fn(),
    getGitHubPullRequests: vi.fn().mockResolvedValue([]),
    getGitHubIssues: vi.fn().mockResolvedValue([]),
    createGitHubPullRequest: vi.fn(),
    createBranch: vi.fn(),
    checkoutBranch: vi.fn(),
    deleteBranch: vi.fn(),
    saveStash: vi.fn(),
    applyStash: vi.fn(),
    dropStash: vi.fn(),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    cherryPick: vi.fn(),
    revertCommit: vi.fn(),
    merge: vi.fn(),
    getBranches: vi.fn().mockResolvedValue([]),
    getStashes: vi.fn().mockResolvedValue([]),
    getTags: vi.fn().mockResolvedValue([]),
  },
}));

describe('useGitHubWorkflow & useGitBranchStashWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles github token authentication', async () => {
    const showToast = vi.fn();
    (GitWorkflowService.setGitHubToken as any).mockResolvedValueOnce({
      authenticated: true,
      user: { login: 'octocat' },
    });

    const { result } = renderHook(() => useGitHubWorkflow(showToast));

    await act(async () => {
      await result.current.handleSaveGitHubToken('ghp_test123');
    });

    expect(result.current.gitHubAuthed).toBe(true);
    expect(result.current.gitHubUser).toEqual({ login: 'octocat' });
    expect(showToast).toHaveBeenCalledWith('Authenticated as octocat', 'success');
  });

  it('handles branch operations in useGitBranchStashWorkflow', async () => {
    const showToast = vi.fn();
    const loadAll = vi.fn();
    const refreshGit = vi.fn();
    (GitWorkflowService.createBranch as any).mockResolvedValueOnce({ success: true });

    const status: any = { branch: 'main', staged: [], unstaged: [], untracked: [] };

    const { result } = renderHook(() =>
      useGitBranchStashWorkflow(status, loadAll, refreshGit, showToast)
    );

    await act(async () => {
      await result.current.handleCreateBranch('feature/test');
    });

    expect(GitWorkflowService.createBranch).toHaveBeenCalledWith('feature/test', true);
    expect(loadAll).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Created & checked out branch "feature/test"', 'success');
  });

  it('handles stash operations', async () => {
    const showToast = vi.fn();
    const loadAll = vi.fn();
    (GitWorkflowService.saveStash as any).mockResolvedValueOnce(true);

    const status: any = { branch: 'main', staged: [], unstaged: [], untracked: [] };

    const { result } = renderHook(() =>
      useGitBranchStashWorkflow(status, loadAll, undefined, showToast)
    );

    await act(async () => {
      await result.current.handleSaveStash('wip work');
    });

    expect(GitWorkflowService.saveStash).toHaveBeenCalledWith('wip work');
    expect(showToast).toHaveBeenCalledWith('Changes stashed', 'success');
  });
});
