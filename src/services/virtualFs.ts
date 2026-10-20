import { FileNode, GitCommit, GitDiff } from '../types/ide';

export class VirtualFileSystem {
  private root: FileNode[];
  private originalFiles: Map<string, string> = new Map();
  private commits: GitCommit[] = [];
  private currentBranch: string = 'main';

  constructor(initialFiles: FileNode[]) {
    this.root = JSON.parse(JSON.stringify(initialFiles));
    this.snapshotOriginals();
    this.initDefaultCommit();
  }

  private snapshotOriginals() {
    this.originalFiles.clear();
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content !== undefined) {
          this.originalFiles.set(node.path, node.content);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(this.root);
  }

  private initDefaultCommit() {
    this.commits = [
      {
        id: 'commit-init',
        hash: 'a1b2c3d',
        message: 'Initial project baseline structure',
        author: 'Vertex Forge Autonomous Orchestrator',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        filesChanged: Array.from(this.originalFiles.keys()),
      },
    ];
  }

  public getTree(): FileNode[] {
    return this.root;
  }

  public findNode(pathStr: string): FileNode | null {
    const cleanPath = pathStr.replace(/^\//, '');
    const traverse = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === cleanPath) return node;
        if (node.children) {
          const found = traverse(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return traverse(this.root);
  }

  public readFile(pathStr: string): string | null {
    const node = this.findNode(pathStr);
    return node && node.type === 'file' ? (node.content ?? '') : null;
  }

  public exists(pathStr: string): boolean {
    return this.findNode(pathStr) !== null;
  }

  public listDirectory(dirPath: string): FileNode[] {
    const clean = dirPath.replace(/^\//, '').replace(/\/$/, '').trim();
    if (!clean || clean === '.') return this.root;

    const node = this.findNode(clean);
    const results: FileNode[] = [];
    if (node && node.type === 'folder' && node.children) {
      results.push(...node.children);
    }

    // Also collect any files matching clean/ prefix
    const prefix = `${clean}/`;
    const traverse = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.path.startsWith(prefix) && !results.some(r => r.path === n.path)) {
          const sub = n.path.slice(prefix.length);
          if (!sub.includes('/') || n.type === 'folder') {
            results.push(n);
          }
        }
        if (n.children) {
          traverse(n.children);
        }
      }
    };
    traverse(this.root);
    return results;
  }

  public getAllFiles(): Map<string, string> {
    const map = new Map<string, string>();
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content !== undefined) {
          map.set(node.path, node.content);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(this.root);
    return map;
  }

  public writeFile(pathStr: string, content: string): boolean {
    const cleanPath = pathStr.replace(/^\//, '');
    const node = this.findNode(cleanPath);

    if (node && node.type === 'file') {
      node.content = content;
      node.isModified = content !== this.originalFiles.get(cleanPath);
      return true;
    }

    // If file doesn't exist, create it along with any missing parent folders
    const segments = cleanPath.split('/');
    const fileName = segments.pop()!;
    let currentLevel = this.root;
    let currentPath = '';

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      let folder = currentLevel.find(n => n.name === segment && n.type === 'folder');
      if (!folder) {
        folder = {
          id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: segment,
          path: currentPath,
          type: 'folder',
          children: [],
        };
        currentLevel.push(folder);
      }
      if (!folder.children) folder.children = [];
      currentLevel = folder.children;
    }

    const ext = fileName.split('.').pop() || '';
    const lang = this.detectLanguage(ext);

    const newFile: FileNode = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: fileName,
      path: cleanPath,
      type: 'file',
      content,
      language: lang,
      isModified: true,
    };

    currentLevel.push(newFile);
    return true;
  }

  public deleteNode(pathStr: string): boolean {
    const cleanPath = pathStr.replace(/^\//, '');
    const segments = cleanPath.split('/');
    const targetName = segments[segments.length - 1];

    const remove = (nodes: FileNode[]): boolean => {
      const idx = nodes.findIndex(n => n.path === cleanPath || n.name === targetName && n.path === cleanPath);
      if (idx !== -1) {
        nodes.splice(idx, 1);
        return true;
      }
      for (const node of nodes) {
        if (node.children && remove(node.children)) {
          return true;
        }
      }
      return false;
    };

    return remove(this.root);
  }

  public searchFiles(query: string): { path: string; line: number; text: string }[] {
    const results: { path: string; line: number; text: string }[] = [];
    if (!query) return results;

    const lowerQuery = query.toLowerCase();
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content) {
          const lines = node.content.split('\n');
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(lowerQuery)) {
              results.push({
                path: node.path,
                line: index + 1,
                text: line.trim(),
              });
            }
          });
        }
        if (node.children) traverse(node.children);
      }
    };
    traverse(this.root);
    return results;
  }

  // Git diff & commit operations
  public getModifiedFiles(): GitDiff[] {
    const diffs: GitDiff[] = [];
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content !== undefined) {
          const orig = this.originalFiles.get(node.path) ?? '';
          if (orig !== node.content) {
            const origLines = orig ? orig.split('\n') : [];
            const currLines = node.content.split('\n');
            const additions = Math.max(0, currLines.length - origLines.length) + 1;
            const deletions = Math.max(0, origLines.length - currLines.length);

            diffs.push({
              filePath: node.path,
              original: orig,
              modified: node.content,
              additions,
              deletions,
            });
          }
        }
        if (node.children) traverse(node.children);
      }
    };
    traverse(this.root);
    return diffs;
  }

  public commit(message: string): GitCommit {
    const modified = this.getModifiedFiles();
    const changedPaths = modified.map(d => d.filePath);
    const hash = Math.random().toString(36).substring(2, 9);

    const commitObj: GitCommit = {
      id: `commit-${Date.now()}`,
      hash,
      message,
      author: 'Vertex Forge Developer',
      timestamp: new Date().toISOString(),
      filesChanged: changedPaths,
    };

    this.commits.unshift(commitObj);
    this.snapshotOriginals();

    // Reset modified flags
    const resetFlags = (nodes: FileNode[]) => {
      for (const node of nodes) {
        node.isModified = false;
        if (node.children) resetFlags(node.children);
      }
    };
    resetFlags(this.root);

    return commitObj;
  }

  public revertFile(pathStr: string): boolean {
    const orig = this.originalFiles.get(pathStr);
    if (orig !== undefined) {
      const node = this.findNode(pathStr);
      if (node && node.type === 'file') {
        node.content = orig;
        node.isModified = false;
        return true;
      }
    }
    return false;
  }

  public getCommits(): GitCommit[] {
    return this.commits;
  }

  public getBranch(): string {
    return this.currentBranch;
  }

  private detectLanguage(ext: string): string {
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
        return 'markdown';
      case 'yml':
      case 'yaml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  }
}
