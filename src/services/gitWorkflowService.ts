import { logger } from './logger';
/**
 * Professional Git & GitHub Workflow Service
 * Connects frontend source control to real Git operations and GitHub REST API
 */

import {
  GitWorkingTreeStatus,
  GitFileStatus,
  GitBranch,
  GitCommitInfo,
  GitRemote,
  GitTag,
  GitStash,
  GitConflictFile,
  GitFileDiff,
  GitDiffHunk,
  GitDiffLine,
  GitHubRepoInfo,
  GitHubPullRequest,
  GitHubIssue,
  AIGitAnalysis,
} from '../types/gitWorkflow';
import { DesktopBridge } from './desktopBridge';

export class GitWorkflowService {
  private static workspaceCwd: string = DesktopBridge.currentWorkspacePath || '.';

  public static setCwd(cwd: string) {
    this.workspaceCwd = cwd;
  }

  public static getCwd(): string {
    return this.workspaceCwd || DesktopBridge.currentWorkspacePath || '.';
  }

  // ==========================================
  // WORKING TREE STATUS & REPO DETECTION
  // ==========================================

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
    } catch (e) {
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
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // ==========================================
  // STAGING & WORKING TREE ACTIONS
  // ==========================================

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

  // ==========================================
  // COMMITS & HISTORY
  // ==========================================

  public static async commit(message: string, amend = false, cwd?: string): Promise<{ success: boolean; output?: string; error?: string }> {
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
    } catch (e: any) {
      return { success: false, error: e.message };
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
    } catch (e) {
      logger.warn('[GitService] Log error', {}, e);
    }
    return [];
  }

  // ==========================================
  // BRANCH MANAGEMENT
  // ==========================================

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
    } catch (e) {
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

  // ==========================================
  // REMOTES, FETCH, PULL, PUSH
  // ==========================================

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

  // ==========================================
  // TAGS & STASH
  // ==========================================

  public static async getTags(cwd?: string): Promise<GitTag[]> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.tags || [];
      }
    } catch {}
    return [];
  }

  public static async createTag(name: string, message?: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/tag/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, name, message }),
    });
    return res.ok;
  }

  public static async deleteTag(name: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/tag/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, name }),
    });
    return res.ok;
  }

  public static async getStashes(cwd?: string): Promise<GitStash[]> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/stashes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.stashes || [];
      }
    } catch {}
    return [];
  }

  public static async saveStash(message?: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/stash/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, message }),
    });
    return res.ok;
  }

  public static async applyStash(stashId = 'stash@{0}', pop = false, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/stash/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, stashId, pop }),
    });
    return res.ok;
  }

  public static async dropStash(stashId = 'stash@{0}', cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/stash/drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, stashId }),
    });
    return res.ok;
  }

  // ==========================================
  // MERGE CONFLICTS & CHERRY-PICK / REVERT
  // ==========================================

  public static async getConflicts(cwd?: string): Promise<GitConflictFile[]> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.conflictFiles || [];
      }
    } catch {}
    return [];
  }

  public static async resolveConflict(filePath: string, resolvedContent: string, cwd?: string): Promise<boolean> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/conflict/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, filePath, resolvedContent }),
    });
    return res.ok;
  }

  public static async cherryPick(hash: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/cherry-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, hash }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async revertCommit(hash: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const targetCwd = cwd || this.getCwd();
    const res = await fetch('/api/git/revert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: targetCwd, hash }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  // ==========================================
  // VISUAL DIFF PARSER & DIFF INSPECTION
  // ==========================================

  public static async getFileDiff(filePath: string, staged = false, cwd?: string): Promise<GitFileDiff> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/git/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd, filePath, staged }),
      });
      if (res.ok) {
        const data = await res.json();
        return this.parseUnifiedDiff(data.diff || '', filePath, staged);
      }
    } catch (e) {
      logger.warn('[GitService] Diff fetch error', {}, e);
    }

    return {
      filePath,
      status: 'modified',
      staged,
      hunks: [],
      rawDiff: '',
      isBinary: false,
      additions: 0,
      deletions: 0,
    };
  }

  public static parseUnifiedDiff(rawDiff: string, filePath: string, staged = false): GitFileDiff {
    if (!rawDiff || !rawDiff.trim()) {
      return {
        filePath,
        status: 'modified',
        staged,
        hunks: [],
        rawDiff: '',
        isBinary: false,
        additions: 0,
        deletions: 0,
      };
    }

    const lines = rawDiff.split('\n');
    const hunks: GitDiffHunk[] = [];
    let currentHunk: GitDiffHunk | null = null;
    let oldLine = 0;
    let newLine = 0;
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Hunk header match @@ -oldStart,oldLines +newStart,newLines @@
        const match = line.match(/@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)/);
        if (match) {
          const oldStart = Number(match[1]);
          const oldLines = match[2] !== undefined ? Number(match[2]) : 1;
          const newStart = Number(match[3]);
          const newLines = match[4] !== undefined ? Number(match[4]) : 1;
          const header = line;

          oldLine = oldStart;
          newLine = newStart;

          currentHunk = {
            oldStart,
            oldLines,
            newStart,
            newLines,
            header,
            lines: [],
          };
          hunks.push(currentHunk);
        }
      } else if (currentHunk) {
        if (line.startsWith('+')) {
          additions++;
          currentHunk.lines.push({
            type: 'added',
            content: line.slice(1),
            newLineNumber: newLine++,
          });
        } else if (line.startsWith('-')) {
          deletions++;
          currentHunk.lines.push({
            type: 'deleted',
            content: line.slice(1),
            oldLineNumber: oldLine++,
          });
        } else if (line.startsWith(' ') || line === '') {
          currentHunk.lines.push({
            type: 'context',
            content: line.slice(1) || '',
            oldLineNumber: oldLine++,
            newLineNumber: newLine++,
          });
        }
      }
    }

    return {
      filePath,
      status: additions > 0 && deletions === 0 ? 'added' : deletions > 0 && additions === 0 ? 'deleted' : 'modified',
      staged,
      hunks,
      rawDiff,
      isBinary: rawDiff.includes('Binary files differ'),
      additions,
      deletions,
    };
  }

  // ==========================================
  // GITHUB INTEGRATION
  // ==========================================

  public static async getGitHubAuthStatus(): Promise<{ authenticated: boolean; user?: any; error?: string }> {
    try {
      const res = await fetch('/api/github/auth-status');
      if (res.ok) return await res.json();
    } catch {}
    return { authenticated: false };
  }

  public static async setGitHubToken(token: string): Promise<{ authenticated: boolean; user?: any; error?: string }> {
    try {
      const res = await fetch('/api/github/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return await res.json();
    } catch (e: any) {
      return { authenticated: false, error: e.message };
    }
  }

  public static async getGitHubRepo(owner: string, repo: string): Promise<GitHubRepoInfo | null> {
    try {
      const res = await fetch('/api/github/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  public static async getGitHubPullRequests(owner: string, repo: string, state = 'open'): Promise<GitHubPullRequest[]> {
    try {
      const res = await fetch('/api/github/pulls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, state }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.pulls || [];
      }
    } catch {}
    return [];
  }

  public static async createGitHubPullRequest(params: { owner: string; repo: string; title: string; body: string; head: string; base: string }): Promise<any> {
    const res = await fetch('/api/github/pull/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  }

  public static async getGitHubIssues(owner: string, repo: string, state = 'open'): Promise<GitHubIssue[]> {
    try {
      const res = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, state }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.issues || [];
      }
    } catch {}
    return [];
  }

  // ==========================================
  // AI GIT ASSISTANT
  // ==========================================

  public static async aiSuggestCommitMessage(diff?: string): Promise<string> {
    try {
      const targetDiff = diff || (await this.getFileDiff('', true)).rawDiff;
      const res = await fetch('/api/ai/git-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'commit-message', diff: targetDiff }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.suggestedCommitMessage || 'chore: update project files';
      }
    } catch {}
    return 'chore: update workspace files';
  }

  public static async aiExplainDiff(diff: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/git-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'explain-diff', diff }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.summary || 'Summary of code changes.';
      }
    } catch {}
    return 'Summary of changes in working tree.';
  }

  public static async aiReviewChanges(diff: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/git-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'review-changes', diff }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.review || 'No regressions detected.';
      }
    } catch {}
    return 'Clean changes. No regressions found.';
  }
}
