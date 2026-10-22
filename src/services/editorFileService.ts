import { OpenTab } from '../types/ide';
import { DesktopBridge } from './desktopBridge';
import { VirtualFileSystem } from './virtualFs';
import { logger } from './logger';

export interface OpenFileRequest {
  workspaceId: string;
  path: string;
  source:
    | 'explorer'
    | 'drag-drop'
    | 'search'
    | 'quick-open'
    | 'command'
    | 'recent'
    | 'external-os';
  targetGroupId?: number;
  diffMode?: boolean;
  line?: number;
  column?: number;
}

export interface EditorFileService {
  openFile(request: OpenFileRequest): Promise<OpenTab>;
  closeFile(tabId: string): Promise<void>;
  saveFile(tabId: string): Promise<void>;
  saveAll(): Promise<void>;
  activateTab(tabId: string): Promise<void>;
  detectLanguage(filePath: string): string;
  validateFile(workspaceId: string, filePath: string): Promise<{ valid: boolean; error?: string }>;
}

export class CanonicalEditorFileService implements EditorFileService {
  private vfs: VirtualFileSystem | null = null;
  private openTabs: OpenTab[] = [];
  private activeTabId: string | null = null;
  private onTabsChange?: (tabs: OpenTab[], activeId: string | null, activeContent: string) => void;
  private logDiagnostics: boolean = true;

  constructor(
    vfs?: VirtualFileSystem,
    onTabsChange?: (tabs: OpenTab[], activeId: string | null, activeContent: string) => void
  ) {
    if (vfs) this.vfs = vfs;
    if (onTabsChange) this.onTabsChange = onTabsChange;
  }

  public setVFS(vfs: VirtualFileSystem) {
    this.vfs = vfs;
  }

  public setTabsState(tabs: OpenTab[], activeId: string | null) {
    this.openTabs = [...tabs];
    this.activeTabId = activeId;
  }

  public setListener(onTabsChange: (tabs: OpenTab[], activeId: string | null, activeContent: string) => void) {
    this.onTabsChange = onTabsChange;
  }

  public detectLanguage(filePath: string): string {
    const ext = filePath.includes('.') ? '.' + filePath.split('.').pop()!.toLowerCase() : '';
    switch (ext) {
      case '.ts':
        return 'typescript';
      case '.tsx':
        return 'typescriptreact';
      case '.js':
      case '.mjs':
      case '.cjs':
        return 'javascript';
      case '.jsx':
        return 'javascriptreact';
      case '.css':
        return 'css';
      case '.scss':
        return 'scss';
      case '.html':
      case '.htm':
        return 'html';
      case '.json':
        return 'json';
      case '.md':
      case '.markdown':
        return 'markdown';
      case '.py':
        return 'python';
      case '.java':
        return 'java';
      case '.kt':
      case '.kts':
        return 'kotlin';
      case '.dart':
        return 'dart';
      case '.go':
        return 'go';
      case '.rs':
        return 'rust';
      case '.php':
        return 'php';
      case '.sql':
        return 'sql';
      case '.yaml':
      case '.yml':
        return 'yaml';
      case '.sh':
      case '.bash':
      case '.zsh':
        return 'shell';
      case '.xml':
        return 'xml';
      default:
        return 'plaintext';
    }
  }

  public async validateFile(workspaceId: string, filePath: string): Promise<{ valid: boolean; error?: string }> {
    if (!filePath || typeof filePath !== 'string') {
      return { valid: false, error: 'File path is required' };
    }

    // Path traversal check
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.startsWith('../') || normalized.includes('/../') || normalized === '..') {
      return { valid: false, error: 'Path traversal is forbidden' };
    }

    // Check against VFS
    if (this.vfs) {
      const node = this.vfs.findNode(normalized);
      if (node) {
        if (node.type === 'folder') {
          return { valid: false, error: 'Target is a folder, not a file' };
        }
        return { valid: true };
      }
    }

    // Check disk via desktop bridge
    try {
      const inspect = await DesktopBridge.inspectPath(normalized);
      if (inspect.exists) {
        if (inspect.isDirectory) {
          return { valid: false, error: 'Target is a directory, not a file' };
        }
        return { valid: true };
      }
    } catch {
      // fallback
    }

    // If file is in workspace tree
    const tree = await DesktopBridge.getWorkspaceTree(DesktopBridge.currentWorkspacePath);
    const findInTree = (nodes: any[]): boolean => {
      for (const n of nodes) {
        const p = n.path || n.relativePath;
        if (p === normalized) return n.type === 'file';
        if (n.children && findInTree(n.children)) return true;
      }
      return false;
    };

    if (findInTree(tree)) {
      return { valid: true };
    }

    // If file can be read without error
    try {
      const content = await DesktopBridge.readFile(normalized);
      if (content !== null && content !== undefined) {
        return { valid: true };
      }
    } catch {
      // ignore
    }

    // If we have an existing open tab for this path
    if (this.openTabs.some(t => t.filePath === normalized)) {
      return { valid: true };
    }

    return { valid: false, error: `File not found: ${filePath}` };
  }

  public async openFile(request: OpenFileRequest): Promise<OpenTab> {
    const { path, source, diffMode = false } = request;
    const normalizedPath = path.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop() || normalizedPath;
    const language = this.detectLanguage(normalizedPath);

    if (this.logDiagnostics) {
      logger.info(`[Editor] openFile source: ${source} file: ${normalizedPath}`);
    }

    // 1. Check if file is already open in openTabs
    const existingTab = this.openTabs.find(t => t.filePath === normalizedPath);

    // 2. Load file content (VFS buffer preserves unsaved edits)
    let content = this.vfs?.readFile(normalizedPath);
    if (content === null || content === undefined) {
      try {
        content = await DesktopBridge.readFile(normalizedPath);
        if (this.vfs) {
          this.vfs.writeFile(normalizedPath, content);
        }
      } catch {
        content = '';
      }
    }

    if (existingTab) {
      // Re-use tab without duplicating or losing unsaved edits
      this.activeTabId = existingTab.id;
      if (this.logDiagnostics) {
        logger.info(`[Editor] tabActivated ${existingTab.title}`);
      }
      if (this.onTabsChange) {
        this.onTabsChange(this.openTabs, existingTab.id, content ?? '');
      }
      return existingTab;
    }

    // 3. Create brand-new tab
    const newTab: OpenTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      filePath: normalizedPath,
      title: fileName,
      language,
      diffMode,
      isDirty: false,
    };

    this.openTabs = [...this.openTabs, newTab];
    this.activeTabId = newTab.id;

    if (this.logDiagnostics) {
      logger.info(`[Editor] tabActivated ${newTab.title}`);
    }

    if (this.onTabsChange) {
      this.onTabsChange(this.openTabs, newTab.id, content ?? '');
    }

    return newTab;
  }

  public async activateTab(tabId: string): Promise<void> {
    const tab = this.openTabs.find(t => t.id === tabId);
    if (!tab) return;
    this.activeTabId = tab.id;
    const content = this.vfs?.readFile(tab.filePath) ?? '';
    if (this.logDiagnostics) {
      logger.info(`[Editor] tabActivated ${tab.title}`);
    }
    if (this.onTabsChange) {
      this.onTabsChange(this.openTabs, tab.id, content);
    }
  }

  public async closeFile(tabId: string): Promise<void> {
    const filtered = this.openTabs.filter(t => t.id !== tabId);
    let nextActiveId: string | null = null;
    let nextContent = '';

    if (this.activeTabId === tabId) {
      const nextTab = filtered[filtered.length - 1];
      if (nextTab) {
        nextActiveId = nextTab.id;
        nextContent = this.vfs?.readFile(nextTab.filePath) ?? '';
      }
    } else {
      nextActiveId = this.activeTabId;
      const current = filtered.find(t => t.id === nextActiveId);
      if (current) {
        nextContent = this.vfs?.readFile(current.filePath) ?? '';
      }
    }

    this.openTabs = filtered;
    this.activeTabId = nextActiveId;

    if (this.onTabsChange) {
      this.onTabsChange(filtered, nextActiveId, nextContent);
    }
  }

  public async saveFile(tabId: string): Promise<void> {
    const tab = this.openTabs.find(t => t.id === tabId);
    if (!tab) return;
    const content = this.vfs?.readFile(tab.filePath) ?? '';
    await DesktopBridge.writeFile(tab.filePath, content);
    this.openTabs = this.openTabs.map(t => (t.id === tabId ? { ...t, isDirty: false } : t));
    if (this.onTabsChange) {
      this.onTabsChange(this.openTabs, this.activeTabId, content);
    }
  }

  public async saveAll(): Promise<void> {
    for (const tab of this.openTabs) {
      if (tab.isDirty) {
        const content = this.vfs?.readFile(tab.filePath) ?? '';
        await DesktopBridge.writeFile(tab.filePath, content);
      }
    }
    this.openTabs = this.openTabs.map(t => ({ ...t, isDirty: false }));
    const activeTab = this.openTabs.find(t => t.id === this.activeTabId);
    const content = activeTab ? this.vfs?.readFile(activeTab.filePath) ?? '' : '';
    if (this.onTabsChange) {
      this.onTabsChange(this.openTabs, this.activeTabId, content);
    }
  }
}

export const editorFileService = new CanonicalEditorFileService();
