import { GitCommitParamsSchema } from '../schemas/gitHubIntegration.schema';
import { logger } from './logger';
import {
  GitWorkingTreeStatus,
  GitBranch,
  GitCommitInfo,
  GitRemote,
  GitTag,
  GitStash,
  GitConflictFile,
  GitFileDiff,
  GitHubRepoInfo,
  GitHubPullRequest,
  GitHubIssue,
} from '../types/gitWorkflow';
import { DesktopBridge } from './desktopBridge';
import { GitHubIntegrationService } from './git/gitHubIntegrationService';
import { GitDiffAndAiService } from './git/gitDiffAndAiService';
import { GitStashAndTagService } from './git/gitStashAndTagService';

export class GitWorkflowService {
  private static workspaceCwd: string = DesktopBridge.currentWorkspacePath || '.';

  public static setCwd(cwd: string) {
    this.workspaceCwd = cwd;
  }

  public static getCwd(): string {
    return this.workspaceCwd || DesktopBridge.currentWorkspacePath || '.';
  }

  // Working Tree Status & Repo Detection
  public static async getStatus(cwd?: string): Promise<GitWorkingTreeStatus> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: unknown) {
      logger.warn('[GitService] Failed to fetch status', {}, e);
    }

    return {
      isRepo: false,
      branch: 'main',
      ahead: 0,
      behind: 0,
      isDetached: false,
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
      hasConflicts: false,
    };
  }

  public static async initRepo(cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) return { success: true };
      const err = await res.json();
      return { success: false, error: err.error };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    }
  }

  // Staging & Working Tree Actions
  public static async stage(filePath: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, filePath }),
    });
    return res.ok;
  }

  public static async stageAll(cwd?: string): Promise<boolean> {
    return this.stage('.', cwd);
  }

  public static async unstage(filePath: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/unstage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, filePath }),
    });
    return res.ok;
  }

  public static async unstageAll(cwd?: string): Promise<boolean> {
    return this.unstage('.', cwd);
  }

  public static async discard(filePath: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/discard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, filePath }),
    });
    return res.ok;
  }

  public static async discardAll(cwd?: string): Promise<boolean> {
    return this.discard('.', cwd);
  }

  public static async cleanUntracked(filePath?: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/clean-untracked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, filePath }),
    });
    return res.ok;
  }

  // Commits & History
  public static async commit(message: string, amend = false, cwd?: string): Promise<{ success: boolean; output?: string; error?: string }> {
    GitCommitParamsSchema.parse({ message, amend, cwd });
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd, message, amend }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, output: data.output };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Commit failed' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    }
  }

  public static async getLog(maxCount = 50, cwd?: string): Promise<GitCommitInfo[]> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd, maxCount }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.commits || [];
      }
    } catch (e: unknown) {
      logger.warn('[GitService] Log error', {}, e);
    }
    return [];
  }

  // Branch Management
  public static async getBranches(cwd?: string): Promise<GitBranch[]> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.branches || [];
      }
    } catch (e: unknown) {
      logger.warn('[GitService] Branches error', {}, e);
    }
    return [{ name: 'main', isCurrent: true, isRemote: false, commitHash: '', commitMessage: '' }];
  }

  public static async createBranch(name: string, checkout = false, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/branch/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, name, checkout }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async checkoutBranch(name: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/branch/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, name }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async renameBranch(oldName: string, newName: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/branch/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, oldName, newName }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async deleteBranch(name: string, force = false, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/branch/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, name, force }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async merge(branch: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd, branch }),
      });
      if (res.ok) return { success: true };
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Merge failed' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Merge failed';
      return { success: false, error: msg };
    }
  }

  // Remotes
  public static async getRemotes(cwd?: string): Promise<GitRemote[]> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/remotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.remotes || [];
      }
    } catch {}
    return [];
  }

  public static async addRemote(name: string, url: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/remote/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, name, url }),
    });
    return res.ok;
  }

  public static async removeRemote(name: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/remote/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, name }),
    });
    return res.ok;
  }

  public static async fetchRemote(remote = 'origin', cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, remote }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async pull(remote = 'origin', branch?: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, remote, branch }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async push(remote = 'origin', branch?: string, force = false, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, remote, branch, force }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  // Tags & Stash Delegation
  public static async getTags(cwd?: string): Promise<GitTag[]> {
    return GitStashAndTagService.getTags(cwd || this.getCwd());
  }

  public static async createTag(name: string, message?: string, cwd?: string): Promise<boolean> {
    return GitStashAndTagService.createTag(name, message, cwd || this.getCwd());
  }

  public static async deleteTag(name: string, cwd?: string): Promise<boolean> {
    return GitStashAndTagService.deleteTag(name, cwd || this.getCwd());
  }

  public static async getStashes(cwd?: string): Promise<GitStash[]> {
    return GitStashAndTagService.getStashes(cwd || this.getCwd());
  }

  public static async saveStash(message?: string, cwd?: string): Promise<boolean> {
    return GitStashAndTagService.saveStash(message, cwd || this.getCwd());
  }

  public static async applyStash(stashId = 'stash@{0}', pop = false, cwd?: string): Promise<boolean> {
    return GitStashAndTagService.applyStash(stashId, pop, cwd || this.getCwd());
  }

  public static async dropStash(stashId = 'stash@{0}', cwd?: string): Promise<boolean> {
    return GitStashAndTagService.dropStash(stashId, cwd || this.getCwd());
  }

  public static async getConflicts(cwd?: string): Promise<GitConflictFile[]> {
    return GitStashAndTagService.getConflicts(cwd || this.getCwd());
  }

  public static async resolveConflict(filePath: string, resolvedContent: string, cwd?: string): Promise<boolean> {
    return GitStashAndTagService.resolveConflict(filePath, resolvedContent, cwd || this.getCwd());
  }

  public static async cherryPick(hash: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    return GitStashAndTagService.cherryPick(hash, cwd || this.getCwd());
  }

  public static async revertCommit(hash: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    return GitStashAndTagService.revertCommit(hash, cwd || this.getCwd());
  }

  // Diff & AI Delegation
  public static parseUnifiedDiff(rawDiff: string, filePath: string, staged = false): GitFileDiff {
    return GitDiffAndAiService.parseUnifiedDiff(rawDiff, filePath, staged);
  }

  public static async getFileDiff(filePath: string, staged = false, cwd?: string): Promise<GitFileDiff> {
    return GitDiffAndAiService.getFileDiff(filePath, staged, cwd || this.getCwd());
  }

  public static async aiSuggestCommitMessage(diff?: string, cwd?: string): Promise<string> {
    return GitDiffAndAiService.aiSuggestCommitMessage(diff, cwd || this.getCwd());
  }

  public static async aiExplainDiff(diff: string): Promise<string> {
    return GitDiffAndAiService.aiExplainDiff(diff);
  }

  public static async aiReviewChanges(diff: string): Promise<string> {
    return GitDiffAndAiService.aiReviewChanges(diff);
  }

  // GitHub Integration Delegation
  public static async getGitHubAuthStatus(): Promise<{ authenticated: boolean; user?: any; error?: string }> {
    return GitHubIntegrationService.getGitHubAuthStatus();
  }

  public static async setGitHubToken(token: string): Promise<{ authenticated: boolean; user?: any; error?: string }> {
    return GitHubIntegrationService.setGitHubToken(token);
  }

  public static async getGitHubRepo(owner: string, repo: string): Promise<GitHubRepoInfo | null> {
    return GitHubIntegrationService.getGitHubRepo(owner, repo);
  }

  public static async getGitHubPullRequests(owner: string, repo: string, state = 'open'): Promise<GitHubPullRequest[]> {
    return GitHubIntegrationService.getGitHubPullRequests(owner, repo, state);
  }

  public static async createGitHubPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<any> {
    return GitHubIntegrationService.createGitHubPullRequest(params);
  }

  public static async getGitHubIssues(owner: string, repo: string, state = 'open'): Promise<GitHubIssue[]> {
    return GitHubIntegrationService.getGitHubIssues(owner, repo, state);
  }
}
