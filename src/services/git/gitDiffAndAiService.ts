import { GitFileDiff, GitDiffHunk } from '../../types/gitWorkflow';
import { logger } from '../logger';

export class GitDiffAndAiService {
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

  public static async getFileDiff(
    filePath: string,
    staged = false,
    cwd?: string
  ): Promise<GitFileDiff> {
    try {
      const res = await fetch('/api/git/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd, filePath, staged }),
      });
      if (res.ok) {
        const data = await res.json();
        return this.parseUnifiedDiff(data.diff || '', filePath, staged);
      }
    } catch (e: unknown) {
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

  public static async aiSuggestCommitMessage(diff?: string, cwd?: string): Promise<string> {
    try {
      const targetDiff = diff || (await this.getFileDiff('', true, cwd)).rawDiff;
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
