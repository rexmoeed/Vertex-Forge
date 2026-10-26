import { IDesktopAPI, WorkspaceFile, CommandExecutionResult } from '../types/desktop';
import { VirtualFileSystem } from './virtualFs';
import { GitProfile, DevServerProcess, ProjectProfile } from '../types/project';
import { logger } from './logger';

/**
 * Universal Production-Grade Desktop Bridge
 * Interfaces with:
 * 1. Electron Preload API (window.desktopAPI) when in Electron desktop bundle
 * 2. Real Node/Express Backend APIs (/api/fs, /api/process, /api/git) for real filesystem & shell
 * 3. Browser File System Access API (showDirectoryPicker) for direct client folder access
 * 4. High-fidelity VFS for instant project templates and sandbox environments
 */
class DesktopBridgeService implements IDesktopAPI {
  private localVfs: VirtualFileSystem | null = null;
  public get isElectron(): boolean {
    return typeof window !== 'undefined' && (!!(window as any).desktopAPI?.isElectron || !!(window as any).desktopAPI);
  }
  public get platform(): 'darwin' | 'win32' | 'linux' {
    return (typeof window !== 'undefined' && (window as any).desktopAPI?.platform) || (typeof process !== 'undefined' && (process.platform as any)) || 'win32';
  }
  public currentWorkspacePath: string = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '/workspace';

  public attachVFS(vfs: VirtualFileSystem) {
    this.localVfs = vfs;
  }

  public async setWorkspacePath(path: string): Promise<{ success: boolean; path?: string }> {
    this.currentWorkspacePath = path;
    if (this.isElectron && (window as any).desktopAPI?.setWorkspacePath) {
      return (window as any).desktopAPI.setWorkspacePath(path);
    }
    return { success: true, path };
  }

  private folderPickerHandler: (() => Promise<string | null>) | null = null;
  private filePickerHandler: (() => Promise<string | null>) | null = null;

  public registerFolderPicker(handler: () => Promise<string | null>) {
    this.folderPickerHandler = handler;
  }

  public registerFilePicker(handler: () => Promise<string | null>) {
    this.filePickerHandler = handler;
  }

  // 1. Directory Picker (Zero native browser dialogs)
  public async openDirectoryDialog(): Promise<string | null> {
    if (this.isElectron && (window as any).desktopAPI?.openDirectoryDialog) {
      return (window as any).desktopAPI.openDirectoryDialog();
    }
    if (this.folderPickerHandler) {
      return await this.folderPickerHandler();
    }
    return null;
  }

  // 1c. File Picker (Zero native browser dialogs)
  public async openFileDialog(): Promise<string | null> {
    if (this.isElectron && (window as any).desktopAPI?.openFileDialog) {
      return (window as any).desktopAPI.openFileDialog();
    }
    if (this.filePickerHandler) {
      return await this.filePickerHandler();
    }
    return null;
  }

  // 1b. Inspect Path (Existence & Conflict Detection)
  public async inspectPath(targetPath: string): Promise<{
    exists: boolean;
    isDirectory: boolean;
    isFile: boolean;
    isEmpty: boolean;
    itemCount: number;
    resolvedPath: string;
    parentExists: boolean;
  }> {
    try {
      const res = await fetch('/api/fs/inspect-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // ignore
    }

    return {
      exists: false,
      isDirectory: false,
      isFile: false,
      isEmpty: true,
      itemCount: 0,
      resolvedPath: targetPath,
      parentExists: true,
    };
  }

  // 2. Read Workspace Tree
  public async getWorkspaceTree(workspacePath: string): Promise<WorkspaceFile[]> {
    if (this.isElectron && (window as any).desktopAPI?.getWorkspaceTree) {
      return (window as any).desktopAPI.getWorkspaceTree(workspacePath);
    }

    try {
      const res = await fetch('/api/fs/read-dir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: workspacePath }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tree && Array.isArray(data.tree)) {
          const filterTree = (nodes: any[]): any[] => {
            return nodes
              .filter(n => {
                const name = (n.name || '').toLowerCase();
                const p = (n.path || n.relativePath || '').toLowerCase();
                return !(
                  name === '.vitest' ||
                  name === 'sample-projects' ||
                  name === '.git' ||
                  name === 'node_modules' ||
                  name === 'dist' ||
                  name === '.gemini' ||
                  p.startsWith('.vitest') ||
                  p.startsWith('sample-projects')
                );
              })
              .map(n => ({
                ...n,
                children: n.children ? filterTree(n.children) : undefined,
              }));
          };
          return filterTree(data.tree);
        }
      }
    } catch (e) {
      // fallback
    }

    if (!this.localVfs) return [];

    const isDummyNode = (n: any) => {
      const name = (n.name || '').toLowerCase();
      const p = (n.path || '').toLowerCase();
      return (
        name === '.vitest' ||
        name === 'sample-projects' ||
        name === '.git' ||
        name === 'node_modules' ||
        name === 'dist' ||
        name === '.gemini' ||
        p.startsWith('.vitest') ||
        p.startsWith('sample-projects')
      );
    };

    const mapNode = (node: any): WorkspaceFile => ({
      name: node.name,
      path: node.path,
      relativePath: node.path,
      type: node.type,
      language: node.language,
      isModified: node.isModified,
      children: node.children ? node.children.filter((c: any) => !isDummyNode(c)).map(mapNode) : undefined,
    });

    return this.localVfs.getTree().filter((n: any) => !isDummyNode(n)).map(mapNode);
  }

  // 3. Read File
  public async readFile(filePath: string): Promise<string> {
    if (this.isElectron && (window as any).desktopAPI?.readFile) {
      return (window as any).desktopAPI.readFile(filePath);
    }

    try {
      const res = await fetch('/api/fs/read-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, cwd: this.currentWorkspacePath }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.content !== undefined && data.content !== null) {
          return data.content;
        }
      }
    } catch (e) {
      // fallback
    }

    const content = this.localVfs?.readFile(filePath);
    if (content === null || content === undefined) {
      throw new Error(`File not found: ${filePath}`);
    }
    return content;
  }

  // 4. Write File
  public async writeFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    if (this.isElectron && (window as any).desktopAPI?.writeFile) {
      return (window as any).desktopAPI.writeFile(filePath, content);
    }

    try {
      const res = await fetch('/api/fs/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content, cwd: this.currentWorkspacePath }),
      });
      if (res.ok) {
        this.localVfs?.writeFile(filePath, content);
        return { success: true };
      }
    } catch (e) {
      // fallback
    }

    const ok = this.localVfs?.writeFile(filePath, content);
    return { success: !!ok };
  }

  // 5. Create File
  public async createFile(filePath: string, initialContent: string = ''): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/fs/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, initialContent, cwd: this.currentWorkspacePath }),
      });
      if (res.ok) {
        this.localVfs?.writeFile(filePath, initialContent);
        return { success: true };
      }
    } catch (e) {
      // fallback
    }
    return this.writeFile(filePath, initialContent);
  }

  // 6. Create Directory
  public async createDirectory(dirPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/fs/create-dir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath, cwd: this.currentWorkspacePath }),
      });
      if (res.ok) {
        this.localVfs?.writeFile(`${dirPath}/.keep`, '');
        return { success: true };
      }
    } catch (e) {
      // fallback
    }
    this.localVfs?.writeFile(`${dirPath}/.keep`, '');
    return { success: true };
  }

  // 7. Delete Path
  public async deletePath(targetPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/fs/delete-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath, cwd: this.currentWorkspacePath }),
      });
      if (res.ok) {
        this.localVfs?.deleteNode(targetPath);
        return { success: true };
      }
    } catch (e) {
      // fallback
    }
    const ok = this.localVfs?.deleteNode(targetPath);
    return { success: !!ok };
  }

  // 8. Rename Path
  public async renamePath(oldPath: string, newPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/fs/rename-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath, cwd: this.currentWorkspacePath }),
      });
      if (res.ok) {
        const c = this.localVfs?.readFile(oldPath);
        if (c !== undefined && c !== null) {
          this.localVfs?.writeFile(newPath, c);
          this.localVfs?.deleteNode(oldPath);
        }
        return { success: true };
      }
    } catch (e) {
      // fallback
    }
    const content = this.localVfs?.readFile(oldPath);
    if (content === null || content === undefined) return { success: false, error: 'Source not found' };
    this.localVfs?.writeFile(newPath, content);
    this.localVfs?.deleteNode(oldPath);
    return { success: true };
  }

  // 9. Search Workspace
  public async searchWorkspace(query: string): Promise<Array<{ filePath: string; line: number; text: string }>> {
    try {
      const res = await fetch('/api/fs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dirPath: this.currentWorkspacePath }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    } catch (e) {
      // fallback
    }
    const results = this.localVfs?.searchFiles(query) || [];
    return results.map(r => ({ filePath: r.path, line: r.line, text: r.text }));
  }

  // 10. Execute Real Command
  public async executeCommand(command: string, options?: { cwd?: string; timeoutMs?: number; env?: Record<string, string>; executionId?: string }): Promise<CommandExecutionResult> {
    const cwd = options?.cwd || this.currentWorkspacePath;
    try {
      const res = await fetch('/api/process/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, cwd, executionId: options?.executionId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      return {
        stdout: '',
        stderr: `[Process Runner Error]: Failed to reach execution backend: ${e?.message || 'Network error'}`,
        exitCode: 1,
        durationMs: 0,
      };
    }

    return {
      stdout: '',
      stderr: `[Process Runner Error]: Execution request failed`,
      exitCode: 1,
      durationMs: 0,
    };
  }

  // 10b. Interrupt Real Running Command
  public async interruptCommand(executionId?: string, pid?: number): Promise<boolean> {
    try {
      const res = await fetch('/api/process/interrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId, pid }),
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.success;
      }
    } catch {
      // ignore
    }
    return false;
  }

  // 11. Start Dev Server (Defaults to port 5173 to avoid collision with IDE port 3000)
  public async startDevServer(command: string, cwd?: string, port = 5173): Promise<DevServerProcess | null> {
    try {
      const res = await fetch('/api/process/dev-server/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, cwd: cwd || this.currentWorkspacePath, port }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      logger.error('Failed to start dev server:', e);
    }
    return null;
  }

  // 11b. Check Real Dev Server Health
  public async checkDevServerHealth(pid: number): Promise<{ isAlive: boolean; isReady: boolean; status: string; healthState: string; statusCode?: number; message?: string }> {
    try {
      const res = await fetch(`/api/process/dev-server/health?pid=${pid}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { isAlive: false, isReady: false, status: 'stopped', healthState: 'stopped', message: 'Unable to connect to health checker' };
  }

  // 12. Stop Dev Server
  public async stopDevServer(pid: number): Promise<boolean> {
    try {
      const res = await fetch('/api/process/dev-server/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // 13. List Dev Servers
  public async listDevServers(): Promise<DevServerProcess[]> {
    try {
      const res = await fetch('/api/process/dev-server/list');
      if (res.ok) {
        const data = await res.json();
        return data.servers || [];
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  // 14. Real Git Status
  public async getGitStatus(workspacePath: string): Promise<{
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
        body: JSON.stringify({ cwd: workspacePath || this.currentWorkspacePath }),
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
    } catch (e) {
      // ignore
    }

    const modified = (this.localVfs?.getModifiedFiles() || []).map(d => d.filePath);
    return {
      isRepo: true,
      branch: this.localVfs?.getBranch() || 'main',
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

  // 15. Real Git Diff
  public async getGitDiff(workspacePath: string, filePath?: string): Promise<string> {
    try {
      const res = await fetch('/api/git/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: workspacePath || this.currentWorkspacePath, filePath }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.diff || '';
      }
    } catch (e) {
      // ignore
    }
    const diffs = this.localVfs?.getModifiedFiles() || [];
    const targetDiffs = filePath ? diffs.filter(d => d.filePath === filePath) : diffs;
    return targetDiffs.map(d => `--- a/${d.filePath}\n+++ b/${d.filePath}\n+${d.additions} -${d.deletions}`).join('\n\n');
  }

  // 16. Real Git Commit
  public async gitCommit(workspacePath: string, message: string): Promise<{ hash: string; success: boolean }> {
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: workspacePath || this.currentWorkspacePath, message }),
      });
      if (res.ok) {
        const c = this.localVfs?.commit(message);
        return { hash: c?.hash || 'commit', success: true };
      }
    } catch (e) {
      // ignore
    }
    const c = this.localVfs?.commit(message);
    return { hash: c?.hash || 'commit', success: true };
  }

  // 17. Real Git Clone
  public async gitClone(repoUrl: string, targetDir?: string): Promise<{ success: boolean; targetPath?: string; error?: string }> {
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
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  // 18. Detect Project Tech Stack
  public async detectProjectStack(rootPath: string): Promise<any> {
    try {
      const res = await fetch('/api/project/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public async checkPathAllowed(filePath: string): Promise<boolean> {
    if (filePath.includes('..') || filePath.includes('.env.production')) return false;
    return true;
  }

  // 19. Validate File for Drag-and-Drop and Canonical Open
  public async validateFile(filePath: string): Promise<{ valid: boolean; error?: string; isFile?: boolean }> {
    if (!filePath || filePath.includes('..')) {
      return { valid: false, error: 'Invalid file path or path traversal detected' };
    }

    if (this.isElectron && (window as any).desktopAPI?.validateFile) {
      return (window as any).desktopAPI.validateFile(filePath);
    }

    // Check backend endpoint
    try {
      const res = await fetch('/api/fs/validate-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, cwd: this.currentWorkspacePath }),
      });
      if (res.ok) {
        const data = await res.json();
        return { valid: data.valid, isFile: data.isFile };
      }
    } catch {
      // fallback to VFS
    }

    // Check local VFS
    if (this.localVfs) {
      const node = this.localVfs.findNode(filePath);
      if (node) {
        if (node.type === 'folder') {
          return { valid: false, error: 'Directories cannot be dropped as files' };
        }
        return { valid: true, isFile: true };
      }
    }

    return { valid: false, error: `File not found: ${filePath}` };
  }
}

export const DesktopBridge = new DesktopBridgeService();
