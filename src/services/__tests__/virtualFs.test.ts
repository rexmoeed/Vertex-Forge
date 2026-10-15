import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualFileSystem } from '../virtualFs';
import type { FileNode } from '../../types/ide';

// Reusable test fixtures
const makeTestTree = (): FileNode[] => [
  {
    id: 'folder-src',
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        id: 'file-index',
        name: 'index.ts',
        path: 'src/index.ts',
        type: 'file',
        content: 'export const main = () => console.log("hello");',
        language: 'typescript',
      },
      {
        id: 'file-utils',
        name: 'utils.ts',
        path: 'src/utils.ts',
        type: 'file',
        content: 'export function add(a: number, b: number) { return a + b; }',
        language: 'typescript',
      },
    ],
  },
  {
    id: 'file-readme',
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    content: '# Test Project\nA sample project for testing.',
    language: 'markdown',
  },
];

describe('VirtualFileSystem - In-Memory File Operations & Git Tracking', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem(makeTestTree());
  });

  // ─── 1. Tree & Node Retrieval ──────────────────────────────────────
  describe('1. Tree & Node Retrieval', () => {
    it('returns the full file tree with correct structure', () => {
      const tree = vfs.getTree();
      expect(tree).toHaveLength(2); // src folder + README.md
      expect(tree[0].name).toBe('src');
      expect(tree[0].type).toBe('folder');
      expect(tree[1].name).toBe('README.md');
    });

    it('finds a nested file node by path', () => {
      const node = vfs.findNode('src/index.ts');
      expect(node).toBeDefined();
      expect(node!.name).toBe('index.ts');
      expect(node!.type).toBe('file');
    });

    it('finds a node with leading slash stripped', () => {
      const node = vfs.findNode('/src/utils.ts');
      expect(node).toBeDefined();
      expect(node!.name).toBe('utils.ts');
    });

    it('returns null for non-existent path', () => {
      expect(vfs.findNode('src/ghost.ts')).toBeNull();
    });
  });

  // ─── 2. File Read & Existence ──────────────────────────────────────
  describe('2. File Read & Existence', () => {
    it('reads file content by path', () => {
      const content = vfs.readFile('src/index.ts');
      expect(content).toContain('export const main');
    });

    it('returns null when reading a folder path', () => {
      expect(vfs.readFile('src')).toBeNull();
    });

    it('returns null when reading non-existent file', () => {
      expect(vfs.readFile('does/not/exist.ts')).toBeNull();
    });

    it('checks existence of files and folders', () => {
      expect(vfs.exists('src')).toBe(true);
      expect(vfs.exists('src/index.ts')).toBe(true);
      expect(vfs.exists('nowhere')).toBe(false);
    });
  });

  // ─── 3. File Write & Auto-create Parent Directories ────────────────
  describe('3. File Write & Directory Auto-creation', () => {
    it('overwrites content of an existing file', () => {
      vfs.writeFile('src/index.ts', 'const updated = true;');
      expect(vfs.readFile('src/index.ts')).toBe('const updated = true;');
    });

    it('creates a new file in an existing directory', () => {
      vfs.writeFile('src/newFile.ts', 'export const x = 42;');
      expect(vfs.exists('src/newFile.ts')).toBe(true);
      expect(vfs.readFile('src/newFile.ts')).toBe('export const x = 42;');
    });

    it('auto-creates nested parent directories for deep paths', () => {
      vfs.writeFile('src/deep/nested/dir/file.ts', 'nested content');
      expect(vfs.exists('src/deep/nested/dir/file.ts')).toBe(true);
      expect(vfs.readFile('src/deep/nested/dir/file.ts')).toBe('nested content');
    });

    it('marks modified files correctly', () => {
      vfs.writeFile('src/index.ts', 'changed content');
      const node = vfs.findNode('src/index.ts');
      expect(node!.isModified).toBe(true);
    });
  });

  // ─── 4. File Deletion ─────────────────────────────────────────────
  describe('4. File Deletion', () => {
    it('deletes an existing file and returns true', () => {
      expect(vfs.exists('README.md')).toBe(true);
      const result = vfs.deleteNode('README.md');
      expect(result).toBe(true);
      expect(vfs.exists('README.md')).toBe(false);
    });

    it('returns false when deleting non-existent node', () => {
      const result = vfs.deleteNode('nonexistent.txt');
      expect(result).toBe(false);
    });
  });

  // ─── 5. Directory Listing ─────────────────────────────────────────
  describe('5. Directory Listing', () => {
    it('lists children of a folder', () => {
      const children = vfs.listDirectory('src');
      expect(children.length).toBeGreaterThanOrEqual(2);
      const names = children.map(c => c.name);
      expect(names).toContain('index.ts');
      expect(names).toContain('utils.ts');
    });

    it('returns root entries for empty/root path', () => {
      const rootEntries = vfs.listDirectory('.');
      expect(rootEntries.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── 6. Full File Map ─────────────────────────────────────────────
  describe('6. Full File Map', () => {
    it('returns a Map of all file paths to their content', () => {
      const allFiles = vfs.getAllFiles();
      expect(allFiles).toBeInstanceOf(Map);
      expect(allFiles.has('src/index.ts')).toBe(true);
      expect(allFiles.has('README.md')).toBe(true);
      expect(allFiles.get('README.md')).toContain('# Test Project');
    });
  });

  // ─── 7. Content Search ────────────────────────────────────────────
  describe('7. Content Search', () => {
    it('finds matching lines across all files (case-insensitive)', () => {
      const results = vfs.searchFiles('export');
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0]).toHaveProperty('path');
      expect(results[0]).toHaveProperty('line');
      expect(results[0]).toHaveProperty('text');
    });

    it('returns empty array for no matches', () => {
      const results = vfs.searchFiles('xyzzy_not_found_anywhere');
      expect(results).toEqual([]);
    });

    it('returns empty array for empty query', () => {
      expect(vfs.searchFiles('')).toEqual([]);
    });
  });

  // ─── 8. Git Diff Tracking ────────────────────────────────────────
  describe('8. Git Diff Tracking', () => {
    it('reports no modified files on a fresh VFS', () => {
      const diffs = vfs.getModifiedFiles();
      expect(diffs).toEqual([]);
    });

    it('detects modifications after writeFile', () => {
      vfs.writeFile('src/index.ts', 'const changed = true;');
      const diffs = vfs.getModifiedFiles();
      expect(diffs.length).toBe(1);
      expect(diffs[0].filePath).toBe('src/index.ts');
      expect(diffs[0].original).toContain('export const main');
      expect(diffs[0].modified).toBe('const changed = true;');
      expect(diffs[0].additions).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── 9. Commit & Revert ──────────────────────────────────────────
  describe('9. Commit & Revert', () => {
    it('commits changes and resets modified flags', () => {
      vfs.writeFile('src/index.ts', 'committed content');
      const commit = vfs.commit('test: verify commit resets flags');

      expect(commit.message).toBe('test: verify commit resets flags');
      expect(commit.hash).toBeTruthy();
      expect(commit.filesChanged).toContain('src/index.ts');

      const node = vfs.findNode('src/index.ts');
      expect(node!.isModified).toBe(false);
    });

    it('reverts a modified file to its last committed state', () => {
      const original = vfs.readFile('src/utils.ts');
      vfs.writeFile('src/utils.ts', 'overwritten junk');
      expect(vfs.readFile('src/utils.ts')).toBe('overwritten junk');

      const reverted = vfs.revertFile('src/utils.ts');
      expect(reverted).toBe(true);
      expect(vfs.readFile('src/utils.ts')).toBe(original);
    });

    it('returns false when reverting a file with no original snapshot', () => {
      vfs.writeFile('brand/new/file.ts', 'no original');
      expect(vfs.revertFile('brand/new/file.ts')).toBe(false);
    });

    it('tracks commit history with initial commit', () => {
      const commits = vfs.getCommits();
      expect(commits.length).toBeGreaterThanOrEqual(1);
      expect(commits[commits.length - 1].message).toBe('Initial project baseline structure');
    });

    it('reports current branch as main', () => {
      expect(vfs.getBranch()).toBe('main');
    });
  });
});
