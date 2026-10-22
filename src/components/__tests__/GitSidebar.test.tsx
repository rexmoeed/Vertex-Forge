import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitSidebar } from '../git/GitSidebar';
import { GitWorkflowService } from '../../services/gitWorkflowService';

vi.mock('../../context/IDEContext', () => ({
  useIDE: () => ({
    openFile: vi.fn(),
    refreshGit: vi.fn(),
  }),
}));

vi.mock('../../services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../services/gitWorkflowService', () => ({
  GitWorkflowService: {
    getStatus: vi.fn(),
    getRemotes: vi.fn(),
    getLog: vi.fn(),
    getBranches: vi.fn(),
    getStashes: vi.fn(),
    getTags: vi.fn(),
    getGitHubAuthStatus: vi.fn(),
    getGitHubPullRequests: vi.fn(),
    getGitHubIssues: vi.fn(),
    stage: vi.fn(),
    stageAll: vi.fn(),
    unstage: vi.fn(),
    unstageAll: vi.fn(),
    commit: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    fetchRemote: vi.fn(),
    aiSuggestCommitMessage: vi.fn(),
    getFileDiff: vi.fn(),
    aiReviewChanges: vi.fn(),
    createBranch: vi.fn(),
    checkoutBranch: vi.fn(),
    deleteBranch: vi.fn(),
  },
}));

describe('GitSidebar Component', () => {
  const mockStatus = {
    isRepo: true,
    branch: 'main',
    ahead: 1,
    behind: 0,
    isDetached: false,
    staged: [
      { path: 'src/App.tsx', status: 'modified', staged: true },
    ],
    unstaged: [
      { path: 'src/index.css', status: 'modified', staged: false },
    ],
    untracked: [],
    conflicted: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(GitWorkflowService.getStatus).mockResolvedValue(mockStatus as any);
    vi.mocked(GitWorkflowService.getRemotes).mockResolvedValue([{ name: 'origin', fetchUrl: 'https://github.com/test/repo.git', pushUrl: '' }] as any);
    vi.mocked(GitWorkflowService.getLog).mockResolvedValue([
      { hash: 'abc1234', message: 'Initial commit', author: 'Dev', date: '2026-10-20', refs: 'HEAD -> main' },
    ] as any);
    vi.mocked(GitWorkflowService.getBranches).mockResolvedValue([
      { name: 'main', current: true, commitHash: 'abc1234' },
      { name: 'feature/login', current: false, commitHash: 'def5678' },
    ] as any);
    vi.mocked(GitWorkflowService.getStashes).mockResolvedValue([] as any);
    vi.mocked(GitWorkflowService.getTags).mockResolvedValue([{ name: 'v1.0.0', commitHash: 'abc1234' }] as any);
    vi.mocked(GitWorkflowService.getGitHubAuthStatus).mockResolvedValue({ isAuthenticated: false } as any);
  });

  it('renders repository status and current branch', () => {
    render(<GitSidebar />);
    expect(screen.getByText('Source Control')).toBeDefined();
    expect(GitWorkflowService.getStatus).toHaveBeenCalled();
  });

  it('switches between sidebar sub-tabs', async () => {
    render(<GitSidebar />);

    const branchesBtn = screen.getAllByRole('button', { name: /^Branches$/i })[0];
    fireEvent.click(branchesBtn);

    await waitFor(() => {
      expect(GitWorkflowService.getBranches).toHaveBeenCalled();
    });

    const historyBtn = screen.getAllByRole('button', { name: /^History$/i })[0];
    fireEvent.click(historyBtn);

    await waitFor(() => {
      expect(GitWorkflowService.getLog).toHaveBeenCalled();
    });
  });

  it('handles commit workflow with message', async () => {
    vi.mocked(GitWorkflowService.commit).mockResolvedValueOnce({
      success: true,
      commitHash: '789abcd',
    } as any);

    render(<GitSidebar />);
    const input = screen.getAllByPlaceholderText(/Commit message/i)[0];
    fireEvent.change(input, { target: { value: 'feat: add user authentication' } });

    const commitBtn = screen.getByRole('button', { name: /Commit \(1\)/i });
    await waitFor(() => {
      expect((commitBtn as HTMLButtonElement).disabled).toBe(false);
    });
    fireEvent.click(commitBtn);

    await waitFor(() => {
      expect(GitWorkflowService.commit).toHaveBeenCalledWith(
        'feat: add user authentication',
        false
      );
    });
  });

  it('triggers stage all changes when button clicked', async () => {
    vi.mocked(GitWorkflowService.stageAll).mockResolvedValueOnce({ success: true } as any);

    render(<GitSidebar />);
    const stageAllBtn = screen.getAllByTitle('Stage All Changes')[0];
    await waitFor(() => {
      expect((stageAllBtn as HTMLButtonElement).disabled).toBe(false);
    });
    fireEvent.click(stageAllBtn);

    await waitFor(() => {
      expect(GitWorkflowService.stageAll).toHaveBeenCalled();
    });
  });

  it('triggers pull and push operations from title icons', async () => {
    vi.mocked(GitWorkflowService.pull).mockResolvedValueOnce({ success: true, updated: true } as any);
    vi.mocked(GitWorkflowService.push).mockResolvedValueOnce({ success: true } as any);

    render(<GitSidebar />);
    const pullBtn = screen.getAllByTitle('Pull latest changes from remote')[0];
    const pushBtn = screen.getAllByTitle('Push changes to remote')[0];

    await waitFor(() => {
      expect((pullBtn as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(pullBtn);
    await waitFor(() => {
      expect(GitWorkflowService.pull).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect((pushBtn as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(pushBtn);
    await waitFor(() => {
      expect(GitWorkflowService.push).toHaveBeenCalled();
    });
  });
});
