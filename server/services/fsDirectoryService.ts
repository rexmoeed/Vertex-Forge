import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { serverLogger } from '../logger';

export const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  '.next',
  '.nuxt',
  '.output',
  '.cache',
  '__pycache__',
  '.vitest',
  'sample-projects',
  '.gemini',
]);

export interface DirectoryTreeNode {
  id: string;
  name: string;
  path: string;
  fullPath: string;
  type: 'folder' | 'file';
  children?: DirectoryTreeNode[];
  size?: number;
}

export async function buildDirectoryTree(
  currentPath: string,
  rootPath: string,
  depth = 0,
  maxDepth = 6
): Promise<DirectoryTreeNode[]> {
  if (depth > maxDepth) return [];
  try {
    const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
    const nodes: DirectoryTreeNode[] = [];

    // Sort folders first, then files
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        const children = await buildDirectoryTree(fullPath, rootPath, depth + 1, maxDepth);
        nodes.push({
          id: `dir-${relativePath}`,
          name: entry.name,
          path: relativePath,
          fullPath,
          type: 'folder',
          children,
        });
      } else if (entry.isFile()) {
        const stats = await fsPromises.stat(fullPath).catch(() => null);
        nodes.push({
          id: `file-${relativePath}`,
          name: entry.name,
          path: relativePath,
          fullPath,
          type: 'file',
          size: stats?.size || 0,
        });
      }
    }
    return nodes;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    serverLogger.warn({ err: message }, `Error reading dir ${currentPath}`);
    return [];
  }
}

export function getAvailableDrives(): string[] {
  if (process.platform !== 'win32') return ['/'];
  const drives: string[] = [];
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const drivePath = `${letter}:\\`;
    try {
      if (fs.existsSync(drivePath)) {
        drives.push(drivePath);
      }
    } catch {
      // drive inaccessible or not mounted
    }
  }
  return drives.length > 0 ? drives : ['C:\\'];
}
