import { VirtualFileSystem } from '../virtualFs';

export class DesktopGitBridge {
  public static async getGitStatus(
    workspacePath: string,
    currentWorkspacePath: string,
    localVfs: VirtualFileSystem | null
  ): Promise<{
    branch: string;
    modified: string[];
    staged: string[];
    untracked: string[];
    isRepo?: boolean;
    ahead?: number;
    behind?: number;
    lastCommit?: any;
    modifiedCount?: number;
    stagedCount?: number;
    untrackedCount?: number;
  }> {
    try {
      const res = await fetch('/api/git/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: workspacePath || currentWorkspacePath }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          isRepo: !!data.isRepo,
          branch: data.branch || 'main',
          ahead: data.ahead || 0,
          behind: data.behind || 0,
          modified: data.modified || [],
          staged: data.staged || [],
          untracked: data.untracked || [],
          modifiedCount: (data.modified || []).length,
          stagedCount: (data.staged || []).length,
          untrackedCount: (data.untracked || []).length,
          lastCommit: data.lastCommit,
        };
      }
    } catch {
      // ignore
    }

    const modified = (localVfs?.getModifiedFiles() || []).map(d => d.filePath);
    return {
      isRepo: true,
      branch: localVfs?.getBranch() || 'main',
      ahead: 0,
      behind: 0,
      modified,
      staged: [],
      untracked: [],
      modifiedCount: modified.length,
      stagedCount: 0,
      untrackedCount: 0,
    };
  }

  public static async getGitDiff(
    workspacePath: string,
    currentWorkspacePath: string,
    localVfs: VirtualFileSystem | null,
    filePath?: string
  ): Promise<string> {
    try {
      const res = await fetch('/api/git/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: workspacePath || currentWorkspacePath, filePath }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.diff || '';
      }
    } catch {
      // ignore
    }
    const diffs = localVfs?.getModifiedFiles() || [];
    const targetDiffs = filePath ? diffs.filter(d => d.filePath === filePath) : diffs;
    return targetDiffs
      .map(d => `--- a/${d.filePath}\n+++ b/${d.filePath}\n+${d.additions} -${d.deletions}`)
      .join('\n\n');
  }

  public static async gitCommit(
    workspacePath: string,
    currentWorkspacePath: string,
    localVfs: VirtualFileSystem | null,
    message: string
  ): Promise<{ hash: string; success: boolean }> {
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: workspacePath || currentWorkspacePath, message }),
      });
      if (res.ok) {
        const c = localVfs?.commit(message);
        return { hash: c?.hash || 'commit', success: true };
      }
    } catch {
      // ignore
    }
    const c = localVfs?.commit(message);
    return { hash: c?.hash || 'commit', success: true };
  }

  public static async gitClone(
    repoUrl: string,
    targetDir?: string
  ): Promise<{ success: boolean; targetPath?: string; error?: string }> {
    try {
      const res = await fetch('/api/git/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, targetDir }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, targetPath: data.targetPath };
      }
      return { success: false, error: data.error || 'Clone failed' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return { success: false, error: msg };
    }
  }
}
