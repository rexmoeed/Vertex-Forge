import { describe, it, expect } from 'vitest';
import { GitConflictAnalyzer } from '../gitConflictAnalyzer';

describe('GitConflictAnalyzer & 3-Way Merge', () => {
  const sampleConflict = `import React from 'react';
<<<<<<< HEAD
const theme = 'dark-neon';
=======
const theme = 'cyberpunk-matrix';
>>>>>>> feature/cyber-theme
export default theme;`;

  it('detects and parses git conflict markers with line numbers', () => {
    const hunks = GitConflictAnalyzer.parseConflicts(sampleConflict);

    expect(hunks.length).toBe(1);
    expect(hunks[0].startLine).toBe(2);
    expect(hunks[0].endLine).toBe(6);
    expect(hunks[0].currentBranchName).toBe('HEAD');
    expect(hunks[0].incomingBranchName).toBe('feature/cyber-theme');
    expect(hunks[0].currentBranchText).toBe("const theme = 'dark-neon';");
    expect(hunks[0].incomingBranchText).toBe("const theme = 'cyberpunk-matrix';");
  });

  it('resolves conflicts using ours strategy cleanly', () => {
    const resolved = GitConflictAnalyzer.resolveFile(sampleConflict, 'ours');

    expect(resolved).toContain("const theme = 'dark-neon';");
    expect(resolved).not.toContain('<<<<<<<');
    expect(resolved).not.toContain('=======');
    expect(resolved).not.toContain('>>>>>>>');
    expect(resolved).not.toContain('cyberpunk-matrix');
  });

  it('resolves conflicts using theirs strategy cleanly', () => {
    const resolved = GitConflictAnalyzer.resolveFile(sampleConflict, 'theirs');

    expect(resolved).toContain("const theme = 'cyberpunk-matrix';");
    expect(resolved).not.toContain('dark-neon');
    expect(resolved).not.toContain('<<<<<<<');
  });

  it('resolves conflicts using union strategy', () => {
    const resolved = GitConflictAnalyzer.resolveFile(sampleConflict, 'union');

    expect(resolved).toContain("const theme = 'dark-neon';");
    expect(resolved).toContain("const theme = 'cyberpunk-matrix';");
  });

  it('returns original content unchanged when no conflict markers are present', () => {
    const cleanContent = "export const PI = 3.14159;\nexport const E = 2.71828;";
    const parsed = GitConflictAnalyzer.parseConflicts(cleanContent);
    const resolved = GitConflictAnalyzer.resolveFile(cleanContent, 'ours');

    expect(parsed).toEqual([]);
    expect(resolved).toBe(cleanContent);
  });
});
