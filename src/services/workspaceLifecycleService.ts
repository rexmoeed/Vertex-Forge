import { Project, FileNode, OpenTab, AgentRole, AgentLog, Archetype } from '../types/ide';
import { ProjectProfile, DetectionContext, GitProfile } from '../types/project';
import { DesktopBridge } from './desktopBridge';
import { GlobalProjectDetector } from './projectDetector';
import { RecentProjects } from './recentProjects';
import { VirtualFileSystem } from './virtualFs';
import { CodebaseIndexer } from './codebaseIndexer';
import { AIProjectNavigator } from './aiNavigator';
import { TerminalRunner } from './terminalRunner';
import { logger } from './logger';

export interface WorkspaceServices {
  vfs: VirtualFileSystem;
  runner: TerminalRunner;
  indexer: CodebaseIndexer;
  navigator: AIProjectNavigator;
}

export interface WorkspaceOpenResult {
  project: Project;
  profile: ProjectProfile;
  services: WorkspaceServices;
  gitProfile: GitProfile;
  openTabs: OpenTab[];
  activeFile: string;
  initialContent: string;
}

export class WorkspaceLifecycleService {
  public static flattenTree(nodes: FileNode[]): string[] {
    let result: string[] = [];
    for (const node of nodes) {
      result.push(node.path || node.name);
      if (node.children) {
        result = result.concat(this.flattenTree(node.children));
      }
    }
    return result;
  }

  public static hasFileInTree(nodes: FileNode[], target: string): boolean {
    for (const node of nodes) {
      if (node.path === target || node.name === target || node.path?.endsWith('/' + target)) {
        return true;
      }
      if (node.children && this.hasFileInTree(node.children, target)) {
        return true;
      }
    }
    return false;
  }

  public static convertToFileNodes(rawFiles: any[]): FileNode[] {
    return rawFiles.map(f => ({
      id: f.id || `node-${f.path || f.relativePath || f.name}`,
      name: f.name,
      path: f.path || f.relativePath,
      type: f.type,
      children: f.children ? this.convertToFileNodes(f.children) : undefined,
    }));
  }

  public static findFirstFile(nodes: FileNode[]): string | null {
    for (const n of nodes) {
      if (n.type === 'file') return n.path;
      if (n.children) {
        const found = this.findFirstFile(n.children);
        if (found) return found;
      }
    }
    return null;
  }

  public static async openLocalFolder(
    folderPath: string,
    onLog?: (agent: AgentRole, action: string, status?: AgentLog['status'], details?: string) => void
  ): Promise<WorkspaceOpenResult> {
    DesktopBridge.setWorkspacePath(folderPath);
    const rawTree = await DesktopBridge.getWorkspaceTree(folderPath);
    const convertedNodes = this.convertToFileNodes(rawTree);
    const flattened = this.flattenTree(convertedNodes);

    const ctx: DetectionContext = {
      rootPath: folderPath,
      files: flattened,
      hasFile: (f) => this.hasFileInTree(convertedNodes, f),
      readFile: async (f) => DesktopBridge.readFile(f).catch(() => null),
    };

    try {
      const pkgRaw = await DesktopBridge.readFile('package.json');
      if (pkgRaw) ctx.packageJson = JSON.parse(pkgRaw);
    } catch {
      // ignore parse errors
    }

    const detected = await GlobalProjectDetector.detectProject(ctx);

    const newVfs = new VirtualFileSystem(convertedNodes);
    const newRunner = new TerminalRunner(newVfs);
    const newIndexer = new CodebaseIndexer(newVfs);
    const newNavigator = new AIProjectNavigator(newVfs, newIndexer);
    DesktopBridge.attachVFS(newVfs);

    const updatedProj: Project = {
      id: detected.id,
      name: detected.name || folderPath.split('/').filter(Boolean).pop() || 'Workspace',
      description: `Local repository at ${folderPath}`,
      rootFiles: convertedNodes,
      techStack: {
        frontend: detected.frontend?.name || detected.frameworks[0] || 'Modern UI',
        styling: detected.styling?.name || 'Tailwind CSS',
        state: detected.state?.name || 'Standard State',
        backend: detected.backend?.name || 'Node.js',
        database: detected.database?.name || 'SQLite',
      },
    };

    const candidateEntry = detected.frontend?.entryPoint;
    const entryFile =
      (candidateEntry && newVfs.readFile(candidateEntry) !== null)
        ? candidateEntry
        : (newVfs.readFile('src/App.tsx') !== null ? 'src/App.tsx'
        : (newVfs.readFile('src/main.tsx') !== null ? 'src/main.tsx'
        : (newVfs.readFile('src/index.tsx') !== null ? 'src/index.tsx'
        : (newVfs.readFile('package.json') !== null ? 'package.json'
        : (this.findFirstFile(convertedNodes) || 'README.md')))));

    if (folderPath && folderPath !== '.' && !folderPath.toLowerCase().includes('vertex-forge-main')) {
      try {
        localStorage.setItem('vertexforge_last_workspace', folderPath);
      } catch {
        // ignore storage errors
      }
    }

    let restoredTabs: OpenTab[] = [];
    let restoredActiveFile = entryFile;

    try {
      const savedTabsRaw = localStorage.getItem(`vertexforge_tabs_${detected.id}`);
      if (savedTabsRaw) {
        const parsed = JSON.parse(savedTabsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          restoredTabs = parsed;
        }
      }
    } catch {
      // ignore storage errors
    }

    try {
      const hotExitRaw = localStorage.getItem(`vertexforge_hot_exit_${detected.id}`);
      if (hotExitRaw) {
        const dirtyList = JSON.parse(hotExitRaw);
        if (Array.isArray(dirtyList)) {
          for (const item of dirtyList) {
            if (item.filePath && typeof item.content === 'string') {
              newVfs.writeFile(item.filePath, item.content);
              const matchTab = restoredTabs.find(t => t.filePath === item.filePath);
              if (matchTab) {
                matchTab.isDirty = true;
              }
            }
          }
          onLog?.('Architect', 'Restored unsaved changes from previous session (Hot Exit).', 'info');
        }
      }
    } catch {
      // ignore storage errors
    }

    if (restoredTabs.length > 0) {
      const savedActiveId = localStorage.getItem(`vertexforge_active_tab_${detected.id}`);
      const activeTab = restoredTabs.find(t => t.id === savedActiveId) || restoredTabs[0];
      restoredActiveFile = activeTab.filePath;
    } else {
      restoredTabs = [{
        id: `tab-${Date.now()}`,
        filePath: entryFile,
        title: entryFile.split('/').pop() || entryFile,
      }];
      restoredActiveFile = entryFile;
    }

    let initialContent = newVfs.readFile(restoredActiveFile) || '';
    if (!initialContent) {
      try {
        initialContent = await DesktopBridge.readFile(restoredActiveFile);
        newVfs.writeFile(restoredActiveFile, initialContent);
      } catch {
        initialContent = '';
      }
    }

    RecentProjects.addProject(detected);

    let gitProfile: GitProfile = {
      isRepo: false,
      branch: 'main',
      ahead: 0,
      behind: 0,
      modifiedCount: 0,
      stagedCount: 0,
      untrackedCount: 0,
    };

    try {
      const git = await DesktopBridge.getGitStatus(folderPath);
      gitProfile = {
        isRepo: !!git.isRepo,
        branch: git.branch || 'main',
        ahead: git.ahead || 0,
        behind: git.behind || 0,
        modifiedCount: git.modifiedCount ?? git.modified?.length ?? 0,
        stagedCount: git.stagedCount ?? git.staged?.length ?? 0,
        untrackedCount: git.untrackedCount ?? git.untracked?.length ?? 0,
        lastCommit: git.lastCommit,
      };
    } catch (err) {
      logger.warn('Failed to retrieve git status during workspace initialization', { cause: err });
    }

    onLog?.('Architect', `Opened local project "${updatedProj.name}" at ${folderPath}`, 'success');

    return {
      project: updatedProj,
      profile: detected,
      services: {
        vfs: newVfs,
        runner: newRunner,
        indexer: newIndexer,
        navigator: newNavigator,
      },
      gitProfile,
      openTabs: restoredTabs,
      activeFile: restoredActiveFile,
      initialContent,
    };
  }

  public static createNewProject(name: string, description: string, archetype: any = 'fullstack-saas'): Project {
    return {
      id: `proj-${Date.now()}`,
      name,
      description,
      techStack: {
        archetype: archetype as Archetype,
        frontend: 'React 19 + TypeScript + Tailwind CSS',
        backend: 'Node.js Express + REST API',
        database: 'PostgreSQL / SQLite',
        testRunner: 'Vitest + React Testing Library',
        styling: 'Tailwind CSS',
        packageManager: 'npm',
        runtime: 'node',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memory: {
        purpose: description,
        requirements: [description],
        architecturalDecisions: ['Decoupled frontend & backend contracts'],
        codingConventions: ['TypeScript strict mode'],
        knownRisks: [],
        testCommands: ['npm test'],
      },
      rootFiles: [
        {
          id: 'f-readme',
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          language: 'markdown',
          content: `# ${name}\n\n${description}\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm test\nnpm run dev\n\`\`\`\n`,
        },
        {
          id: 'dir-src',
          name: 'src',
          path: 'src',
          type: 'folder',
          children: [
            {
              id: 'f-app',
              name: 'App.tsx',
              path: 'src/App.tsx',
              type: 'file',
              language: 'typescript',
              content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8 text-white">\n      <h1 className="text-2xl font-bold">${name}</h1>\n      <p className="text-slate-400 mt-2">${description}</p>\n    </div>\n  );\n}\n`,
            },
          ],
        },
      ],
    };
  }
}
