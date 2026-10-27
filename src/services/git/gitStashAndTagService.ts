import { GitTag, GitStash, GitConflictFile } from '../../types/gitWorkflow';

export class GitStashAndTagService {
  public static async getTags(cwd: string): Promise<GitTag[]> {
    try {
      const res = await fetch('/api/git/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.tags || [];
      }
    } catch {}
    return [];
  }

  public static async createTag(name: string, message?: string, cwd?: string): Promise<boolean> {
    const res = await fetch('/api/git/tag/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, name, message }),
    });
    return res.ok;
  }

  public static async deleteTag(name: string, cwd?: string): Promise<boolean> {
    const res = await fetch('/api/git/tag/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, name }),
    });
    return res.ok;
  }

  public static async getStashes(cwd: string): Promise<GitStash[]> {
    try {
      const res = await fetch('/api/git/stashes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.stashes || [];
      }
    } catch {}
    return [];
  }

  public static async saveStash(message?: string, cwd?: string): Promise<boolean> {
    const res = await fetch('/api/git/stash/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, message }),
    });
    return res.ok;
  }

  public static async applyStash(stashId = 'stash@{0}', pop = false, cwd?: string): Promise<boolean> {
    const res = await fetch('/api/git/stash/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, stashId, pop }),
    });
    return res.ok;
  }

  public static async dropStash(stashId = 'stash@{0}', cwd?: string): Promise<boolean> {
    const res = await fetch('/api/git/stash/drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, stashId }),
    });
    return res.ok;
  }

  public static async getConflicts(cwd: string): Promise<GitConflictFile[]> {
    try {
      const res = await fetch('/api/git/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.conflictFiles || [];
      }
    } catch {}
    return [];
  }

  public static async resolveConflict(filePath: string, resolvedContent: string, cwd?: string): Promise<boolean> {
    const res = await fetch('/api/git/conflict/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, filePath, resolvedContent }),
    });
    return res.ok;
  }

  public static async cherryPick(hash: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/git/cherry-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, hash }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }

  public static async revertCommit(hash: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/git/revert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd, hash }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error };
  }
}
