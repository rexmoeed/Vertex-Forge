/**
 * Git Conflict Resolver & Merge Strategy Analyzer
 * Parses standard Git conflict markers (<<<<<<<, =======, >>>>>>>) and generates resolutions.
 */

export interface ConflictHunk {
  id: string;
  startLine: number;
  endLine: number;
  currentBranchText: string;
  incomingBranchText: string;
  currentBranchName: string;
  incomingBranchName: string;
}

export type MergeResolutionChoice = 'ours' | 'theirs' | 'union';

export class GitConflictAnalyzer {
  public static readonly CONFLICT_START = /^<{7}\s*(.*)$/;
  public static readonly CONFLICT_DIVIDER = /^={7}$/;
  public static readonly CONFLICT_END = /^>{7}\s*(.*)$/;

  public static parseConflicts(fileContent: string): ConflictHunk[] {
    const lines = fileContent.split('\n');
    const conflicts: ConflictHunk[] = [];

    let inConflict = false;
    let currentHunk: Partial<ConflictHunk> | null = null;
    let currentBranchLines: string[] = [];
    let incomingBranchLines: string[] = [];
    let state: 'current' | 'incoming' = 'current';

    lines.forEach((line, index) => {
      const startMatch = line.match(this.CONFLICT_START);
      const dividerMatch = line.match(this.CONFLICT_DIVIDER);
      const endMatch = line.match(this.CONFLICT_END);

      if (startMatch && !inConflict) {
        inConflict = true;
        state = 'current';
        currentBranchLines = [];
        incomingBranchLines = [];
        currentHunk = {
          id: `conflict_${index + 1}`,
          startLine: index + 1,
          currentBranchName: startMatch[1] || 'HEAD',
        };
      } else if (dividerMatch && inConflict) {
        state = 'incoming';
      } else if (endMatch && inConflict) {
        inConflict = false;
        if (currentHunk) {
          conflicts.push({
            id: currentHunk.id!,
            startLine: currentHunk.startLine!,
            endLine: index + 1,
            currentBranchName: currentHunk.currentBranchName || 'HEAD',
            incomingBranchName: endMatch[1] || 'incoming',
            currentBranchText: currentBranchLines.join('\n'),
            incomingBranchText: incomingBranchLines.join('\n'),
          });
        }
        currentHunk = null;
      } else if (inConflict) {
        if (state === 'current') {
          currentBranchLines.push(line);
        } else {
          incomingBranchLines.push(line);
        }
      }
    });

    return conflicts;
  }

  public static resolveFile(fileContent: string, defaultChoice: MergeResolutionChoice = 'ours'): string {
    const lines = fileContent.split('\n');
    const result: string[] = [];

    let inConflict = false;
    let state: 'current' | 'incoming' = 'current';
    let currentLines: string[] = [];
    let incomingLines: string[] = [];

    lines.forEach(line => {
      if (this.CONFLICT_START.test(line)) {
        inConflict = true;
        state = 'current';
        currentLines = [];
        incomingLines = [];
      } else if (this.CONFLICT_DIVIDER.test(line)) {
        state = 'incoming';
      } else if (this.CONFLICT_END.test(line)) {
        inConflict = false;
        if (defaultChoice === 'ours') {
          result.push(...currentLines);
        } else if (defaultChoice === 'theirs') {
          result.push(...incomingLines);
        } else if (defaultChoice === 'union') {
          result.push(...currentLines, ...incomingLines);
        }
      } else if (inConflict) {
        if (state === 'current') {
          currentLines.push(line);
        } else {
          incomingLines.push(line);
        }
      } else {
        result.push(line);
      }
    });

    return result.join('\n');
  }
}
