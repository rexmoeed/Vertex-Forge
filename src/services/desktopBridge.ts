import { IDesktopAPI, WorkspaceFile, CommandExecutionResult } from '../types/desktop';
import { VirtualFileSystem } from './virtualFs';
import { DevServerProcess } from '../types/project';
import { DesktopProcessBridge } from './desktop/desktopProcessBridge';
import { DesktopGitBridge } from './desktop/desktopGitBridge';

export { DesktopProcessBridge } from './desktop/desktopProcessBridge';
export { DesktopGitBridge } from './desktop/desktopGitBridge';

/**
 * Universal Production-Grade Desktop Bridge
 * Interfaces with Electron Preload, backend endpoints, and VFS sandbox.
 */
class DesktopBridgeService implements IDesktopAPI {
  private localVfs: VirtualFileSystem | null = null;

  public get isElectron(): boolean {
    return typeof window !== 'undefined' && (!!(window as any).desktopAPI?.isElectron || !!(window as any).desktopAPI);
  }

  public get platform(): 'darwin' | 'win32' | 'linux' {
    return (
      (typeof window !== 'undefined' && (window as any).desktopAPI?.platform) ||
      (typeof process !== 'undefined' && (process.platform as any)) ||
      'win32'
    );
  }

  public currentWorkspacePath: string =
    typeof process !== 'undefined' && process.cwd ? process.cwd() : '/workspace';

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

  public async openDirectoryDialog(): Promise<string | null> {
    if (this.isElectron && (window as any).desktopAPI?.openDirectoryDialog) {
      return (window as any).desktopAPI.openDirectoryDialog();
    }
    if (this.folderPickerHandler) {
      return await this.folderPickerHandler();
    }
    return null;
  }

  public async openFileDialog(): Promise<string | null> {
    if (this.isElectron && (window as any).desktopAPI?.openFileDialog) {
      return (window as any).desktopAPI.openFileDialog();
    }
    if (this.filePickerHandler) {
      return await this.filePickerHandler();
    }
    return null;
  }

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
    } catch {
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
    } catch {
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
    } catch {
      // fallback
    }

    const content = this.localVfs?.readFile(filePath);
    if (content === null || content === undefined) {
      throw new Error(`File not found: ${filePath}`);
    }
    return content;
  }

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
    } catch {
      // fallback
    }

    const ok = this.localVfs?.writeFile(filePath, content);
    return { success: !!ok };
  }

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
    } catch {
      // fallback
    }
    return this.writeFile(filePath, initialContent);
  }

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
    } catch {
      // fallback
    }
    this.localVfs?.writeFile(`${dirPath}/.keep`, '');
    return { success: true };
  }

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
    } catch {
      // fallback
    }
    const ok = this.localVfs?.deleteNode(targetPath);
    return { success: !!ok };
  }

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
    } catch {
      // fallback
    }
    const content = this.localVfs?.readFile(oldPath);
    if (content === null || content === undefined) return { success: false, error: 'Source not found' };
    this.localVfs?.writeFile(newPath, content);
    this.localVfs?.deleteNode(oldPath);
    return { success: true };
  }

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
    } catch {
      // fallback
    }
    const results = this.localVfs?.searchFiles(query) || [];
    return results.map(r => ({ filePath: r.path, line: r.line, text: r.text }));
  }

  public async executeCommand(
    command: string,
    options?: { cwd?: string; timeoutMs?: number; env?: Record<string, string>; executionId?: string }
  ): Promise<CommandExecutionResult> {
    return DesktopProcessBridge.executeCommand(command, this.currentWorkspacePath, options);
  }

  public async interruptCommand(executionId?: string, pid?: number): Promise<boolean> {
    return DesktopProcessBridge.interruptCommand(executionId, pid);
  }

  public async startDevServer(command: string, cwd?: string, port = 5173): Promise<DevServerProcess | null> {
    return DesktopProcessBridge.startDevServer(command, this.currentWorkspacePath, cwd, port);
  }

  public async checkDevServerHealth(
    pid: number
  ): Promise<{ isAlive: boolean; isReady: boolean; status: string; healthState: string; statusCode?: number; message?: string }> {
    return DesktopProcessBridge.checkDevServerHealth(pid);
  }

  public async stopDevServer(pid: number): Promise<boolean> {
    return DesktopProcessBridge.stopDevServer(pid);
  }

  public async listDevServers(): Promise<DevServerProcess[]> {
    return DesktopProcessBridge.listDevServers();
  }

  public async getGitStatus(workspacePath: string) {
    return DesktopGitBridge.getGitStatus(workspacePath, this.currentWorkspacePath, this.localVfs);
  }

  public async getGitDiff(workspacePath: string, filePath?: string): Promise<string> {
    return DesktopGitBridge.getGitDiff(workspacePath, this.currentWorkspacePath, this.localVfs, filePath);
  }

  public async gitCommit(workspacePath: string, message: string): Promise<{ hash: string; success: boolean }> {
    return DesktopGitBridge.gitCommit(workspacePath, this.currentWorkspacePath, this.localVfs, message);
  }

  public async gitClone(repoUrl: string, targetDir?: string): Promise<{ success: boolean; targetPath?: string; error?: string }> {
    return DesktopGitBridge.gitClone(repoUrl, targetDir);
  }

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
    } catch {
      // ignore
    }
    return null;
  }

  public async checkPathAllowed(filePath: string): Promise<boolean> {
    if (filePath.includes('..') || filePath.includes('.env.production')) return false;
    return true;
  }

  public async validateFile(filePath: string): Promise<{ valid: boolean; error?: string; isFile?: boolean }> {
    if (!filePath || filePath.includes('..')) {
      return { valid: false, error: 'Invalid file path or path traversal detected' };
    }

    if (this.isElectron && (window as any).desktopAPI?.validateFile) {
      return (window as any).desktopAPI.validateFile(filePath);
    }

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
      // fallback
    }

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
