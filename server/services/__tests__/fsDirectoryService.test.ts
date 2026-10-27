import { describe, it, expect } from 'vitest';
import { buildDirectoryTree, getAvailableDrives, IGNORED_DIRS } from '../fsDirectoryService';
import path from 'path';

describe('fsDirectoryService', () => {
  it('defines standard ignored directories', () => {
    expect(IGNORED_DIRS.has('.git')).toBe(true);
    expect(IGNORED_DIRS.has('node_modules')).toBe(true);
    expect(IGNORED_DIRS.has('dist')).toBe(true);
  });

  it('builds directory tree within max depth', async () => {
    const cwd = process.cwd();
    const tree = await buildDirectoryTree(cwd, cwd, 0, 1);
    expect(Array.isArray(tree)).toBe(true);
    expect(tree.length).toBeGreaterThan(0);
    const hasPackageJson = tree.some(node => node.name === 'package.json' && node.type === 'file');
    expect(hasPackageJson).toBe(true);
  });

  it('returns valid drive list', () => {
    const drives = getAvailableDrives();
    expect(Array.isArray(drives)).toBe(true);
    expect(drives.length).toBeGreaterThan(0);
  });
});
