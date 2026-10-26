import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import net from 'net';
import http from 'http';
import { ChildProcess } from 'child_process';
import { validateBody, CommonSchemas } from '../middleware/validation';

const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', '.next', '.nuxt', '.output', '.cache', '__pycache__', '.vitest', 'sample-projects', '.gemini']);

async function buildDirectoryTree(currentPath: string, rootPath: string, depth = 0, maxDepth = 6): Promise<any[]> {
  if (depth > maxDepth) return [];
  try {
    const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
    const nodes: any[] = [];

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
  } catch (err: any) {
    serverLogger.warn(`Error reading dir ${currentPath}:`, err?.message);
    return [];
  }
}

// 1. Read Directory Tree

export function createFsRouter(): Router {
  const router = Router();

router.post('/api/fs/read-dir', async (req: Request, res: Response) => {
  const { dirPath, maxDepth = 6 } = req.body;
  const targetDir = dirPath ? path.resolve(dirPath) : process.cwd();

  try {
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: `Directory not found: ${targetDir}` });
    }
    const tree = await buildDirectoryTree(targetDir, targetDir, 0, maxDepth);
    return res.json({
      rootPath: targetDir,
      name: path.basename(targetDir),
      tree,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to read directory' });
  }
});

// 2. Read File Content
router.post('/api/fs/read-file', async (req: Request, res: Response) => {
  const { filePath, cwd } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });

  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(cwd || process.cwd(), filePath);
  try {
    const content = await fsPromises.readFile(resolved, 'utf-8');
    return res.json({ content, path: resolved });
  } catch (err: any) {
    return res.status(404).json({ error: `File not found: ${resolved}` });
  }
});

// 2b. Canonical File Validation for Drag-and-Drop and Editor Open
router.post('/api/fs/validate-file', async (req: Request, res: Response) => {
  const { filePath, cwd } = req.body;
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ valid: false, error: 'filePath is required' });
  }

  const workspaceRoot = cwd ? path.resolve(cwd) : process.cwd();
  const normalized = filePath.replace(/\\/g, '/');

  // Prevent path traversal
  if (normalized.startsWith('../') || normalized.includes('/../') || normalized === '..') {
    return res.status(400).json({ valid: false, error: 'Path traversal is forbidden' });
  }

  const resolved = path.isAbsolute(normalized) ? path.resolve(normalized) : path.resolve(workspaceRoot, normalized);

  // Ensure path is inside workspaceRoot
  const rel = path.relative(workspaceRoot, resolved);
  if (rel.startsWith('..') && !path.isAbsolute(rel)) {
    return res.status(403).json({ valid: false, error: 'File is outside active workspace' });
  }

  try {
    const stat = await fsPromises.stat(resolved);
    if (stat.isDirectory()) {
      return res.status(400).json({ valid: false, isFile: false, isDirectory: true, error: 'Target is a directory, not a file' });
    }
    return res.json({
      valid: true,
      isFile: true,
      resolvedPath: resolved,
      relativePath: path.relative(workspaceRoot, resolved).replace(/\\/g, '/'),
      size: stat.size,
    });
  } catch {
    return res.status(404).json({ valid: false, error: `File not found: ${filePath}` });
  }
});

// 3. Write File Content
router.post('/api/fs/write-file', async (req: Request, res: Response) => {
  const { filePath, content, cwd } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });

  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(cwd || process.cwd(), filePath);
  try {
    await fsPromises.mkdir(path.dirname(resolved), { recursive: true });
    await fsPromises.writeFile(resolved, content || '', 'utf-8');
    return res.json({ success: true, path: resolved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to write file' });
  }
});

// 4. Create File
router.post('/api/fs/create-file', async (req: Request, res: Response) => {
  const { filePath, initialContent = '', cwd } = req.body;
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(cwd || process.cwd(), filePath);

  try {
    await fsPromises.mkdir(path.dirname(resolved), { recursive: true });
    await fsPromises.writeFile(resolved, initialContent, 'utf-8');
    return res.json({ success: true, path: resolved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create file' });
  }
});

// 5. Create Directory
router.post('/api/fs/create-dir', async (req: Request, res: Response) => {
  const { dirPath, cwd } = req.body;
  const resolved = path.isAbsolute(dirPath) ? dirPath : path.resolve(cwd || process.cwd(), dirPath);

  try {
    await fsPromises.mkdir(resolved, { recursive: true });
    return res.json({ success: true, path: resolved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create directory' });
  }
});

// 6. Delete File or Directory
router.post('/api/fs/delete-path', async (req: Request, res: Response) => {
  const { targetPath, cwd } = req.body;
  const resolved = path.isAbsolute(targetPath) ? targetPath : path.resolve(cwd || process.cwd(), targetPath);

  try {
    await fsPromises.rm(resolved, { recursive: true, force: true });
    return res.json({ success: true, path: resolved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to delete path' });
  }
});

// 7. Rename File or Directory
router.post('/api/fs/rename-path', async (req: Request, res: Response) => {
  const { oldPath, newPath, cwd } = req.body;
  const resolvedOld = path.isAbsolute(oldPath) ? oldPath : path.resolve(cwd || process.cwd(), oldPath);
  const resolvedNew = path.isAbsolute(newPath) ? newPath : path.resolve(cwd || process.cwd(), newPath);

  try {
    await fsPromises.mkdir(path.dirname(resolvedNew), { recursive: true });
    await fsPromises.rename(resolvedOld, resolvedNew);
    return res.json({ success: true, oldPath: resolvedOld, newPath: resolvedNew });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to rename path' });
  }
});

// 8. Search Workspace Files
router.post('/api/fs/search', async (req: Request, res: Response) => {
  const { query, dirPath } = req.body;
  if (!query) return res.json({ results: [] });

  const targetDir = dirPath ? path.resolve(dirPath) : process.cwd();
  const results: Array<{ filePath: string; line: number; text: string }> = [];

  async function searchInDir(dir: string, depth = 0) {
    if (depth > 6 || results.length > 100) return;
    try {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await searchInDir(full, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html', '.py', '.go', '.rs'].includes(ext)) {
            continue;
          }
          const content = await fsPromises.readFile(full, 'utf-8').catch(() => null);
          if (content) {
            const lines = content.split('\n');
            const qLower = query.toLowerCase();
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(qLower)) {
                results.push({
                  filePath: path.relative(targetDir, full).replace(/\\/g, '/'),
                  line: i + 1,
                  text: lines[i].trim(),
                });
                if (results.length > 100) break;
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  await searchInDir(targetDir);
  return res.json({ results });
});

// 8b. Inspect Path (Existence, Directory / File status, Conflict detection)
router.post('/api/fs/inspect-path', async (req: Request, res: Response) => {
  const { targetPath } = req.body;
  if (!targetPath) return res.status(400).json({ error: 'targetPath is required' });

  const resolved = path.resolve(targetPath);
  try {
    const parentDir = path.dirname(resolved);
    const parentExists = fs.existsSync(parentDir);
    const exists = fs.existsSync(resolved);

    if (!exists) {
      return res.json({
        exists: false,
        resolvedPath: resolved,
        parentExists,
        isDirectory: false,
        isFile: false,
        isEmpty: true,
        itemCount: 0,
      });
    }

    const stat = await fsPromises.stat(resolved);
    const isDirectory = stat.isDirectory();
    const isFile = stat.isFile();
    let itemCount = 0;
    let isEmpty = true;

    if (isDirectory) {
      const items = await fsPromises.readdir(resolved);
      itemCount = items.length;
      isEmpty = items.length === 0;
    }

    return res.json({
      exists: true,
      resolvedPath: resolved,
      parentExists,
      isDirectory,
      isFile,
      isEmpty,
      itemCount,
      size: stat.size,
    });
  } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to inspect path' });
    }
  });

function getAvailableDrives(): string[] {
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

// 8c. In-App Filesystem Browser for Seamless Project & Folder Opening (Zero Native Popups)
router.post('/api/fs/browse-dirs', async (req: Request, res: Response) => {
  const { currentPath } = req.body;
  const initial = currentPath ? path.resolve(currentPath) : process.cwd();

  try {
    const stat = await fsPromises.stat(initial).catch(() => null);
    const targetDir = stat && stat.isDirectory() ? initial : (fs.existsSync(path.dirname(initial)) ? path.dirname(initial) : process.cwd());
    const entries = await fsPromises.readdir(targetDir, { withFileTypes: true });

    const folders: Array<{ name: string; path: string; hasSubfolders: boolean }> = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const full = path.join(targetDir, entry.name);
        folders.push({
          name: entry.name,
          path: full.replace(/\\/g, '/'),
          hasSubfolders: true,
        });
      }
    }

    folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const parentDir = path.dirname(targetDir);
    const isRoot = parentDir === targetDir;

    // Windows or Unix normalized breadcrumbs
    const normalized = targetDir.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    const breadcrumbs: Array<{ name: string; path: string }> = [];

    let accum = '';
    if (process.platform === 'win32' && /^[a-zA-Z]:/.test(normalized)) {
      accum = parts[0];
      breadcrumbs.push({ name: parts[0], path: accum + '/' });
      for (let i = 1; i < parts.length; i++) {
        accum += '/' + parts[i];
        breadcrumbs.push({ name: parts[i], path: accum });
      }
    } else {
      breadcrumbs.push({ name: '/', path: '/' });
      for (const p of parts) {
        accum += '/' + p;
        breadcrumbs.push({ name: p, path: accum });
      }
    }

    const homedir = os.homedir().replace(/\\/g, '/');
    const shortcuts = [
      { name: 'Current Project', path: process.cwd().replace(/\\/g, '/') },
      { name: 'Home', path: homedir },
      { name: 'Desktop', path: `${homedir}/Desktop` },
      { name: 'Documents', path: `${homedir}/Documents` },
      { name: 'Downloads', path: `${homedir}/Downloads` },
    ].filter(s => {
      try { return fs.existsSync(s.path); } catch { return false; }
    });

    return res.json({
      currentPath: normalized,
      parentPath: isRoot ? null : parentDir.replace(/\\/g, '/'),
      isRoot,
      breadcrumbs,
      folders,
      drives: getAvailableDrives().map(d => d.replace(/\\/g, '/')),
      shortcuts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to browse directory' });
  }
});

// 8d. In-App Directory Creation
router.post('/api/fs/create-dir', async (req: Request, res: Response) => {
  const { dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'dirPath is required' });

  try {
    const resolved = path.resolve(dirPath);
    await fsPromises.mkdir(resolved, { recursive: true });
    return res.json({ success: true, path: resolved.replace(/\\/g, '/') });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create directory' });
  }
});

// ==========================================
// REAL PROCESS RUNNER & DEV SERVER MANAGER
// ==========================================

interface DevServerProcessRecord {
  pid: number;
  command: string;
  cwd: string;
  port: number;
  detectedPort?: number;
  status: 'starting' | 'probing' | 'running' | 'stopped' | 'failed';
  startTime: number;
  url: string;
  logs: string[];
  childRef?: any;
  portConflictDetected?: boolean;
  healthState: 'pending' | 'healthy' | 'unhealthy' | 'stopped';
  lastHealthCheck?: {
    timestamp: number;
    ok: boolean;
    statusCode?: number;
    latencyMs?: number;
    message: string;
  };
}

const activeServers = new Map<number, DevServerProcessRecord>();
const activeCommands = new Map<string, { pid: number; child: ChildProcess; startTime: number }>();

// Helper: Check if a TCP port is currently free on localhost
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => {
        resolve(false);
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '0.0.0.0');
  });
}

// Helper: Find next available port to resolve port conflicts
async function findAvailablePort(preferredPort: number, excludedPorts: number[] = [(Number(process.env.PORT) || 3000)]): Promise<number> {
  const candidates = [preferredPort, 5173, 5174, 5175, 3001, 3002, 8080, 8081];
  for (const p of candidates) {
    if (excludedPorts.includes(p)) continue;
    const available = await isPortAvailable(p);
    if (available) return p;
  }
  // Fallback: random high port
  return 5173;
}

// Helper: Verify HTTP readiness of a server endpoint
function verifyHttpReadiness(url: string, timeoutMs: number = 2500): Promise<{ ok: boolean; statusCode?: number; latencyMs?: number; message: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    try {
      const parsed = new URL(url);
      const req = http.get({
        hostname: parsed.hostname || 'localhost',
        port: parsed.port || 80,
        path: parsed.pathname || '/',
        timeout: timeoutMs,
        headers: { 'User-Agent': 'VertexForge-HealthChecker/1.0' },
      }, (res) => {
        const latencyMs = Date.now() - startTime;
        // Drain response
        res.resume();
        resolve({
          ok: (res.statusCode !== undefined && res.statusCode < 500),
          statusCode: res.statusCode,
          latencyMs,
          message: `HTTP ${res.statusCode} responded in ${latencyMs}ms`,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          latencyMs: Date.now() - startTime,
          message: 'Connection timed out during health check probe',
        });
      });

      req.on('error', (err) => {
        resolve({
          ok: false,
          latencyMs: Date.now() - startTime,
          message: `Health probe error: ${err.message}`,
        });
      });
    } catch (e: any) {
      resolve({
        ok: false,
        latencyMs: 0,
        message: `Invalid URL format: ${e.message}`,
      });
    }
  });
}

// 9. Execute Real Shell Command (with cancellation / tracking)

  return router;
}
