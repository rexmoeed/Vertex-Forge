/**
 * Unified Diff Parser & Hunk Statistic Generator
 * Parses standard Git unified diff patches into structured hunks and calculates additions/deletions.
 */

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface ParsedDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

export interface FileDiffSummary {
  oldPath: string;
  newPath: string;
  additions: number;
  deletions: number;
  hunks: ParsedDiffHunk[];
}

export class DiffHunkParser {
  private static readonly HUNK_HEADER_REGEX = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$/;

  public static parseUnifiedDiff(diffText: string): FileDiffSummary[] {
    if (!diffText || typeof diffText !== 'string') return [];

    const fileSummaries: FileDiffSummary[] = [];
    const rawFiles = diffText.split(/^diff --git /m).filter(Boolean);

    for (const rawFile of rawFiles) {
      const lines = rawFile.split('\n');
      let oldPath = '';
      let newPath = '';
      let additions = 0;
      let deletions = 0;
      const hunks: ParsedDiffHunk[] = [];
      let currentHunk: ParsedDiffHunk | null = null;
      let currentOldLine = 0;
      let currentNewLine = 0;

      for (const line of lines) {
        if (line.startsWith('--- a/')) {
          oldPath = line.substring(6);
          continue;
        }
        if (line.startsWith('+++ b/')) {
          newPath = line.substring(6);
          continue;
        }

        const hunkMatch = line.match(this.HUNK_HEADER_REGEX);
        if (hunkMatch) {
          if (currentHunk) {
            hunks.push(currentHunk);
          }

          const oldStart = parseInt(hunkMatch[1], 10);
          const oldLineCount = hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1;
          const newStart = parseInt(hunkMatch[3], 10);
          const newLineCount = hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1;

          currentOldLine = oldStart;
          currentNewLine = newStart;

          currentHunk = {
            oldStart,
            oldLines: oldLineCount,
            newStart,
            newLines: newLineCount,
            header: line,
            lines: [],
          };
          continue;
        }

        if (currentHunk) {
          if (line.startsWith('+')) {
            additions++;
            currentHunk.lines.push({
              type: 'add',
              content: line.substring(1),
              newLineNumber: currentNewLine++,
            });
          } else if (line.startsWith('-')) {
            deletions++;
            currentHunk.lines.push({
              type: 'delete',
              content: line.substring(1),
              oldLineNumber: currentOldLine++,
            });
          } else if (line.startsWith(' ') || line === '') {
            currentHunk.lines.push({
              type: 'context',
              content: line.startsWith(' ') ? line.substring(1) : line,
              oldLineNumber: currentOldLine++,
              newLineNumber: currentNewLine++,
            });
          }
        }
      }

      if (currentHunk) {
        hunks.push(currentHunk);
      }

      if (oldPath || newPath || hunks.length > 0) {
        fileSummaries.push({
          oldPath: oldPath || 'dev/null',
          newPath: newPath || 'dev/null',
          additions,
          deletions,
          hunks,
        });
      }
    }

    return fileSummaries;
  }
}

