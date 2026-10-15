import React, { useState, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { FILE_DRAG_MIME, FileDragPayload } from '../../types/dragDrop';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  GitBranch,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  Layers,
  FlaskConical,
  Play,
  Wrench,
  Shield,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PanelLeft,
  PanelRight,
  X,
  Copy,
  Edit2,
  GitCommit,
  Code2,
  Blocks,
  Download,
  Star,
} from 'lucide-react';
import { FileNode, AgentRole } from '../../types/ide';
import { DebugSidebar } from '../debug/DebugSidebar';
import { GitSidebar } from '../git/GitSidebar';
import { TestExplorerPanel } from '../testing/TestExplorerPanel';

export const Sidebar: React.FC = () => {
  const layout = useLayout();
  const {
    activeSidebarTab,
    fileTree,
    activeFile,
    activeFileContent,
    openFile,
    createFileOrFolder,
    deleteFileOrFolder,
    modifiedFiles,
    commitChanges,
    revertFile,
    testResults,
    runTests,
    triggerSelfHealDebug,
    activeProject,
    activeAgent,
    setActiveAgent,
    autonomyMode,
    setAutonomyMode,
    vfs,
    setIsOpenFolderModalOpen,
    setIsProjectWizardOpen,
    setIsCloneModalOpen,
    openLocalFolder,
  } = useIDE() as any;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ path: string; line: number; text: string }>>([]);

  // Git state
  const [commitMessage, setCommitMessage] = useState('');

  // New file/folder input state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [draggingPath, setDraggingPath] = useState<string | null>(null);

  // Outline, Timeline & File Context Menu States
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);

  // Close context menu on outside click
  React.useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Extensions Marketplace State
  const [extensionSearch, setExtensionSearch] = useState('');
  const [extensionFilter, setExtensionFilter] = useState<'all' | 'installed' | 'recommended'>('all');
  const [installedExtensions, setInstalledExtensions] = useState<Record<string, { installed: boolean; enabled: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('vertex_installed_extensions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'ts-tools': { installed: true, enabled: true },
      'eslint': { installed: true, enabled: true },
      'prettier': { installed: true, enabled: true },
      'tailwind': { installed: true, enabled: true },
      'gitlens': { installed: true, enabled: true },
      'mcp-agent': { installed: true, enabled: true },
      'python': { installed: false, enabled: false },
      'docker': { installed: false, enabled: false },
      'prisma': { installed: false, enabled: false },
      'rust': { installed: false, enabled: false },
    };
  });

  const toggleExtensionInstalled = (id: string) => {
    setInstalledExtensions(prev => {
      const current = prev[id] || { installed: false, enabled: false };
      const next = {
        ...prev,
        [id]: { installed: !current.installed, enabled: !current.installed },
      };
      try {
        localStorage.setItem('vertex_installed_extensions', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleExtensionEnabled = (id: string) => {
    setInstalledExtensions(prev => {
      const current = prev[id] || { installed: true, enabled: true };
      const next = {
        ...prev,
        [id]: { ...current, enabled: !current.enabled },
      };
      try {
        localStorage.setItem('vertex_installed_extensions', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Filter out build artifacts, test dumps (.vitest), and sample fixtures (sample-projects)
  const cleanTree = React.useMemo(() => {
    const isExcluded = (node: FileNode): boolean => {
      const name = (node.name || '').toLowerCase();
      const p = (node.path || '').toLowerCase();
      return (
        name === '.vitest' ||
        name === 'sample-projects' ||
        name === 'node_modules' ||
        name === '.git' ||
        name === 'dist' ||
        name === '.gemini' ||
        name === '.cache' ||
        name === '__pycache__' ||
        p.startsWith('.vitest') ||
        p.startsWith('sample-projects')
      );
    };

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return (nodes || [])
        .filter(n => !isExcluded(n))
        .map(n => ({
          ...n,
          children: n.children ? filterNodes(n.children) : undefined,
        }));
    };

    return filterNodes(fileTree || []);
  }, [fileTree]);

  // Check if a real workspace folder has been opened by user
  const isNoFolderOpened = !activeProject || !activeProject.rootFiles || activeProject.rootFiles.length === 0 || activeProject.id === 'workspace-local';

  // Parse symbols from activeFileContent for Outline View
  const outlineSymbols = React.useMemo(() => {
    if (!activeFileContent) return [];
    const lines = activeFileContent.split('\n');
    const symbols: Array<{ name: string; type: 'interface' | 'type' | 'function' | 'class'; line: number }> = [];
    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      const ifaceMatch = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_]+)/);
      if (ifaceMatch) symbols.push({ name: ifaceMatch[1], type: 'interface', line: idx + 1 });
      const typeMatch = trimmed.match(/^(?:export\s+)?type\s+([A-Za-z0-9_]+)/);
      if (typeMatch) symbols.push({ name: typeMatch[1], type: 'type', line: idx + 1 });
      const classMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)/);
      if (classMatch) symbols.push({ name: classMatch[1], type: 'class', line: idx + 1 });
      const fnMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
      if (fnMatch) symbols.push({ name: fnMatch[1], type: 'function', line: idx + 1 });
      const methodMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*\([^)]*\)\s*:/);
      if (methodMatch && !['constructor', 'if', 'for', 'switch'].includes(methodMatch[1])) {
        symbols.push({ name: methodMatch[1], type: 'function', line: idx + 1 });
      }
    });
    return symbols;
  }, [activeFileContent]);

  // Real commits from VFS / Git for Timeline View (no hardcoded fake commits)
  const displayCommits = React.useMemo(() => {
    const list = vfs?.getCommits?.() || [];
    if (list.length > 0) {
      return list.map((c: any) => ({
        hash: (c.hash || c.id || '').slice(0, 7),
        msg: c.message,
        time: c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        author: c.author || 'User',
      }));
    }
    return [
      { hash: 'HEAD', msg: 'Initial project baseline structure', time: 'Baseline', author: 'Vertex Forge' }
    ];
  }, [vfs]);

  // Drag-and-drop movement threshold tracking to prevent accidental click misfires
  const DRAG_THRESHOLD = 4;
  const pointerStartRef = useRef<{ x: number; y: number; didDrag: boolean }>({ x: 0, y: 0, didDrag: false });

  const handlePointerDown = (e: React.MouseEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, didDrag: false };
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        pointerStartRef.current.didDrag = true;
      }
    }
  };

  const handleFileDragStart = (e: React.DragEvent, node: FileNode) => {
    if (node.type !== 'file') {
      e.preventDefault();
      return;
    }
    pointerStartRef.current.didDrag = true;
    setDraggingPath(node.path);
    e.dataTransfer.effectAllowed = 'copy';

    const payload: FileDragPayload = {
      path: node.path,
      relativePath: node.path,
      workspaceId: activeProject?.id || 'workspace',
      type: 'file',
    };
    e.dataTransfer.setData(FILE_DRAG_MIME, JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', node.path);
    console.log(`[DragDrop] dragstart file: ${node.path}`);
  };

  const handleFileDragEnd = () => {
    setDraggingPath(null);
    setTimeout(() => {
      pointerStartRef.current.didDrag = false;
    }, 120);
  };

  const toggleFolder = (path: string) => {
    setCollapsedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (isCreatingFile) {
      createFileOrFolder(newItemName.trim(), 'file');
      setIsCreatingFile(false);
    } else if (isCreatingFolder) {
      createFileOrFolder(newItemName.trim(), 'folder');
      setIsCreatingFolder(false);
    }
    setNewItemName('');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: Array<{ path: string; line: number; text: string }> = [];
    const searchNode = (node: FileNode) => {
      if (node.type === 'file' && node.content) {
        const lines = node.content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              path: node.path,
              line: idx + 1,
              text: line.trim(),
            });
          }
        });
      }
      if (node.children) {
        node.children.forEach(searchNode);
      }
    };
    fileTree.forEach(searchNode);
    setSearchResults(results.slice(0, 50));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
      return <span className="text-cyan-400 font-bold text-xs shrink-0 select-none">⚛</span>;
    }
    if (fileName.endsWith('.ts')) {
      return <span className="text-blue-400 font-mono text-[9px] font-bold px-0.5 rounded bg-blue-500/15 shrink-0 select-none">TS</span>;
    }
    if (fileName.endsWith('.css') || fileName.endsWith('.scss')) {
      return <span className="text-cyan-300 font-bold text-xs shrink-0 select-none">#</span>;
    }
    if (fileName.endsWith('.json')) {
      return <span className="text-amber-400 font-bold text-xs shrink-0 select-none">&#123;&#125;</span>;
    }
    if (fileName.endsWith('.md')) {
      return <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    }
    if (fileName.endsWith('.py')) {
      return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  // Render file tree recursively
  const renderTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map(node => {
      const isFolder = node.type === 'folder';
      const isCollapsed = collapsedFolders[node.path];
      const isSelected = activeFile === node.path;
      const isModified = modifiedFiles.some((m: any) => m.filePath === node.path);

      const isBeingDragged = draggingPath === node.path;

      return (
        <div key={node.id} className="flex flex-col">
          <div
            draggable={!isFolder}
            onDragStart={(e) => handleFileDragStart(e, node)}
            onDragEnd={handleFileDragEnd}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                x: Math.min(e.clientX, window.innerWidth - 200),
                y: Math.min(e.clientY, window.innerHeight - 240),
                node,
              });
            }}
            tabIndex={0}
            role="treeitem"
            aria-selected={isSelected}
            className={`group flex items-center justify-between py-1 px-2 cursor-pointer text-xs rounded transition-colors select-none ${
              isBeingDragged ? 'opacity-50 ring-1 ring-indigo-400' : ''
            } ${
              isSelected
                ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-white/10 dark:text-white'
                : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            onClick={() => {
              if (pointerStartRef.current.didDrag) {
                return;
              }
              if (isFolder) {
                toggleFolder(node.path);
              } else {
                openFile(node.path);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (isFolder) {
                  toggleFolder(node.path);
                } else {
                  openFile(node.path);
                }
              }
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              {isFolder ? (
                <>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  {isCollapsed ? (
                    <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3.5 shrink-0" />
                  {getFileIcon(node.name)}
                </>
              )}
              <span className="truncate text-[12px]">{node.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isModified && (
                <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0 mr-1 select-none" title="Modified in working tree">
                  M
                </span>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (confirm(`Delete ${node.name}?`)) {
                    deleteFileOrFolder(node.path);
                  }
                }}
                className="p-1 hover:text-rose-400 text-slate-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isFolder && !isCollapsed && node.children && (
            <div className="flex flex-col">{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  const agentsList: { role: AgentRole; title: string; desc: string; icon: string }[] = [
    { role: 'Architect', title: 'Principal Architect', desc: 'Requirements analysis, tech stack selection, data models, and API contracts.', icon: '🏗️' },
    { role: 'Developer', title: 'Senior Developer', desc: 'Full-stack implementation, multi-file code writing, and refactoring.', icon: '💻' },
    { role: 'Frontend', title: 'Frontend Specialist', desc: 'Responsive interfaces, accessibility, UI components, and state.', icon: '🎨' },
    { role: 'Backend', title: 'Backend Specialist', desc: 'REST/GraphQL endpoints, database schemas, authentication, and security.', icon: '⚙️' },
    { role: 'Mobile', title: 'Mobile Specialist', desc: 'Native Kotlin/Compose, Swift/SwiftUI, and React Native / Expo.', icon: '📱' },
    { role: 'Testing', title: 'Testing Specialist', desc: 'Unit, integration, and assertion tests with complete coverage.', icon: '🧪' },
    { role: 'Debugger', title: 'Self-Correction Debugger', desc: 'Root-cause analysis, error reproduction, and automated patch verification.', icon: '🩺' },
    { role: 'Reviewer', title: 'Security & Code Auditor', desc: 'AST inspection, secret leak prevention, and regression checks.', icon: '🛡️' },
    { role: 'DocGen', title: 'Technical Writer', desc: 'Architecture documentation, API references, and quickstart guides.', icon: '📚' },
  ];

  return (
    <div
      style={{
        width: `${layout.config.primarySidebarWidth}px`,
        backgroundColor: 'var(--ide-sidebar-bg)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-text)',
      }}
      className="flex flex-col h-full self-stretch min-h-0 select-none shrink-0 border rounded-xl overflow-hidden shadow-sm"
    >
      {/* 1. EXPLORER TAB */}
      {activeSidebarTab === 'explorer' && (
        <div className="flex flex-col h-full">
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-black/30">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 truncate pr-2 font-mono">
              {isNoFolderOpened ? 'NO FOLDER OPENED' : (activeProject?.name || 'Workspace').toUpperCase()}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsCreatingFile(true);
                  setIsCreatingFolder(false);
                }}
                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                title="New File"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsCreatingFolder(true);
                  setIsCreatingFile(false);
                }}
                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                title="New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => layout.setPrimarySidebarPosition(layout.config.primarySidebarPosition === 'left' ? 'right' : 'left')}
                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                title={layout.config.primarySidebarPosition === 'left' ? 'Move Sidebar Right' : 'Move Sidebar Left'}
              >
                {layout.config.primarySidebarPosition === 'left' ? <PanelRight className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={layout.togglePrimarySidebar}
                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                title="Collapse Sidebar (Cmd+B)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New file/folder input */}
          {(isCreatingFile || isCreatingFolder) && (
            <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <input
                type="text"
                autoFocus
                placeholder={isCreatingFile ? 'src/components/NewFile.tsx' : 'src/new-folder'}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex justify-end gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFile(false);
                    setIsCreatingFolder(false);
                  }}
                  className="px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* File Tree List or No Folder Opened Guide */}
          {isNoFolderOpened ? (
            <div className="flex-1 flex flex-col items-center justify-center p-5 text-center select-none">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">No Folder Opened</h3>
              <p className="text-[11px] text-slate-400 mb-4 max-w-[210px] leading-relaxed">
                You have not yet opened a workspace folder. Open a project to start coding with AI tools.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[190px]">
                <button
                  onClick={() => openLocalFolder()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Open Folder...</span>
                </button>
                <button
                  onClick={() => setIsProjectWizardOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>New Project with AI</span>
                </button>
                <button
                  onClick={() => setIsCloneModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
                >
                  <GitBranch className="w-4 h-4 text-amber-400" />
                  <span>Clone Git Repo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-1">{renderTree(cleanTree)}</div>
          )}

          {/* Outline & Timeline Sections */}
          <div className="border-t border-slate-800 flex flex-col text-xs select-none shrink-0">
            {/* Outline Header */}
            <div
              onClick={() => setIsOutlineOpen(!isOutlineOpen)}
              className="px-3 py-1.5 flex items-center justify-between text-slate-400 hover:text-white cursor-pointer hover:bg-slate-900/60 transition"
            >
              <div className="flex items-center gap-1.5">
                {isOutlineOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-sans">Outline</span>
              </div>
              {activeFile && (
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">
                  {activeFile.split('/').pop()}
                </span>
              )}
            </div>

            {/* Outline Content */}
            {isOutlineOpen && (
              <div className="max-h-40 overflow-y-auto px-2 py-1 bg-black/40 border-t border-slate-900 space-y-0.5">
                {outlineSymbols.length === 0 ? (
                  <div className="px-2 py-1.5 text-[10px] text-slate-500 italic">No symbols found in file</div>
                ) : (
                  outlineSymbols.map((sym, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded hover:bg-emerald-500/10 hover:text-[var(--ide-accent,#00ff88)] cursor-pointer flex items-center gap-1.5 text-[11px] text-slate-300 font-mono transition"
                    >
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          sym.type === 'interface'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : sym.type === 'type'
                            ? 'bg-amber-500/20 text-amber-400'
                            : sym.type === 'function'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {sym.type[0].toUpperCase()}
                      </span>
                      <span className="truncate">{sym.name}</span>
                      <span className="text-[9px] text-slate-500 ml-auto font-sans">:{sym.line}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Timeline Header */}
            <div
              onClick={() => setIsTimelineOpen(!isTimelineOpen)}
              className="px-3 py-1.5 flex items-center justify-between text-slate-400 hover:text-white cursor-pointer hover:bg-slate-900/60 transition border-t border-slate-800/60"
            >
              <div className="flex items-center gap-1.5">
                {isTimelineOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-sans">Timeline</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">Git History</span>
            </div>

            {/* Timeline Content */}
            {isTimelineOpen && (
              <div className="max-h-40 overflow-y-auto px-2 py-1 bg-black/40 border-t border-slate-900 space-y-1">
                {displayCommits.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded hover:bg-emerald-500/10 cursor-pointer flex flex-col gap-0.5 text-xs border border-transparent hover:border-emerald-500/20 transition"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-[var(--ide-accent,#00ff88)]">{c.hash}</span>
                      <span className="text-slate-500">{c.time}</span>
                    </div>
                    <span className="text-[11px] text-slate-300 truncate">{c.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SEARCH TAB */}
      {activeSidebarTab === 'search' && (
        <div className="flex flex-col h-full p-3 gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Search in Workspace</div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search code or keywords..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {searchQuery ? `${searchResults.length} results found` : 'Type to search across all files'}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
            {searchResults.map((res, i) => (
              <div
                key={i}
                onClick={() => openFile({ workspaceId: activeProject?.id || 'workspace', path: res.path, source: 'search', line: res.line })}
                className="p-2 rounded bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 cursor-pointer border border-slate-200 dark:border-slate-750 flex flex-col gap-0.5"
                title={`Open ${res.path} at line ${res.line}`}
              >
                <div className="flex justify-between items-center text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                  <span className="truncate">{res.path}</span>
                  <span className="text-slate-400 dark:text-slate-500">:{res.line}</span>
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono truncate">{res.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. GIT SOURCE CONTROL */}
      {activeSidebarTab === 'git' && (
        <GitSidebar />
      )}

      {/* 4. TESTS TAB */}
      {activeSidebarTab === 'tests' && (
        <TestExplorerPanel />
      )}

      {/* 5. AGENTS INSPECTOR TAB */}
      {activeSidebarTab === 'agents' && (
        <div className="flex flex-col h-full p-3 gap-2 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Specialized Autonomous Agents
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Select an agent to direct prompt inquiries or assign specialized lifecycle responsibilities.
          </p>

          <div className="flex flex-col gap-2 mt-2">
            {agentsList.map(agent => (
              <div
                key={agent.role}
                onClick={() => setActiveAgent(agent.role)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  activeAgent === agent.role
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{agent.icon}</span>
                    <span className="text-xs font-bold text-white">{agent.title}</span>
                  </div>
                  {activeAgent === agent.role && (
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TECH STACK TAB */}
      {activeSidebarTab === 'stack' && (
        <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Intelligent Tech Stack Selection
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex flex-col gap-2 text-xs">
            <span className="text-slate-400 uppercase text-[10px] font-semibold">Current Archetype</span>
            <span className="font-bold text-indigo-300 capitalize">{activeProject.techStack.archetype ? activeProject.techStack.archetype.replace('-', ' ') : 'Universal Workspace'}</span>

            <div className="border-t border-slate-700/60 pt-2 flex flex-col gap-1.5">
              <div>
                <span className="text-slate-400 text-[10px] block">Frontend</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.frontend}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Backend</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.backend || 'Node.js'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Database</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.database || 'None / In-Memory'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Test Suite</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.testRunner || 'Vitest'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-300">Architect Rationale</span>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
              {activeProject.memory?.purpose || 'Full-stack application development workspace with live code execution and terminal orchestration.'}
            </p>
          </div>
        </div>
      )}

      {/* 7. SETTINGS TAB */}
      {activeSidebarTab === 'settings' && (
        <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Settings & Model Config</div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex flex-col gap-2 text-xs">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Active AI Model</span>
            <span className="font-bold text-emerald-400 font-mono">gemini-3.8-flash</span>
            <p className="text-[10px] text-slate-400">
              Google AI Studio modern genai engine connected via server-side proxy route.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <label className="font-semibold text-slate-300">Autonomy Permission Level</label>
            <select
              value={autonomyMode}
              onChange={e => setAutonomyMode(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
            >
              <option value="assist">Assist (Always ask human confirmation)</option>
              <option value="supervised">Supervised (Automatic safe edits, confirm terminal)</option>
              <option value="autonomous">Autonomous (Full self-planning & self-repair)</option>
            </select>
          </div>
        </div>
      )}

      {/* 8. RUN & DEBUG TAB (DAP Multi-Language Debugger) */}
      {activeSidebarTab === 'debug' && <DebugSidebar />}

      {/* 9. EXTENSIONS & PLUGINS MARKETPLACE TAB */}
      {activeSidebarTab === 'extensions' && (
        <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Extensions & Plugins</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {Object.values(installedExtensions).filter(x => x.installed).length} Installed
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Extensions in Marketplace..."
              value={extensionSearch}
              onChange={e => setExtensionSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-750 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[11px] border-b border-slate-800 pb-2">
            {(['all', 'installed', 'recommended'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setExtensionFilter(tab)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                  extensionFilter === tab
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Extension Cards List */}
          <div className="flex flex-col gap-2">
            {[
              {
                id: 'ts-tools',
                name: 'TypeScript & JavaScript Features',
                publisher: 'Microsoft',
                version: 'v5.6.2',
                rating: '4.9',
                downloads: '42.5M',
                icon: 'TS',
                iconBg: 'bg-blue-600/20 text-blue-400',
                desc: 'Rich IntelliSense, symbol navigation, type checking, and smart JSX/TSX diagnostics.',
                recommended: true,
              },
              {
                id: 'eslint',
                name: 'ESLint',
                publisher: 'Dirk Baeumer',
                version: 'v2.4.4',
                rating: '4.7',
                downloads: '31.2M',
                icon: 'ES',
                iconBg: 'bg-indigo-600/20 text-indigo-400',
                desc: 'Integrates ESLint into Vertex Forge with live error underlining and quick-fix actions.',
                recommended: true,
              },
              {
                id: 'prettier',
                name: 'Prettier - Code Formatter',
                publisher: 'Prettier',
                version: 'v10.1.0',
                rating: '4.8',
                downloads: '38.9M',
                icon: 'P',
                iconBg: 'bg-amber-600/20 text-amber-400',
                desc: 'Multi-language code formatting on file save with configured rules and tab width.',
                recommended: true,
              },
              {
                id: 'tailwind',
                name: 'Tailwind CSS IntelliSense',
                publisher: 'Tailwind Labs',
                version: 'v0.12.7',
                rating: '4.9',
                downloads: '18.4M',
                icon: 'TW',
                iconBg: 'bg-cyan-600/20 text-cyan-400',
                desc: 'Autocomplete, hover previews, and syntax validation for Tailwind utility classes.',
                recommended: true,
              },
              {
                id: 'gitlens',
                name: 'GitLens — Git Supercharged',
                publisher: 'GitKraken',
                version: 'v15.2.0',
                rating: '4.8',
                downloads: '29.1M',
                icon: 'GL',
                iconBg: 'bg-rose-600/20 text-rose-400',
                desc: 'Line-by-line blame annotations, visual commit graphs, and branch diff explorers.',
                recommended: true,
              },
              {
                id: 'mcp-agent',
                name: 'Model Context Protocol (MCP) Hub',
                publisher: 'Vertex Forge & Antigravity',
                version: 'v1.4.0',
                rating: '5.0',
                downloads: '2.4M',
                icon: '✦',
                iconBg: 'bg-emerald-600/20 text-emerald-400',
                desc: 'Connect specialized MCP tools, file system servers, and autonomous agent capabilities.',
                recommended: true,
              },
              {
                id: 'python',
                name: 'Python & Pylance',
                publisher: 'Microsoft',
                version: 'v2024.18.0',
                rating: '4.6',
                downloads: '95.0M',
                icon: 'Py',
                iconBg: 'bg-emerald-600/20 text-emerald-400',
                desc: 'Python language support with syntax checking, virtualenv auto-discovery, and debugging.',
                recommended: false,
              },
              {
                id: 'docker',
                name: 'Docker & Containers',
                publisher: 'Microsoft',
                version: 'v1.29.1',
                rating: '4.7',
                downloads: '26.8M',
                icon: 'Dk',
                iconBg: 'bg-blue-600/20 text-blue-400',
                desc: 'Manage dockerfiles, compose environments, image builds, and container logs directly.',
                recommended: false,
              },
              {
                id: 'prisma',
                name: 'Prisma ORM',
                publisher: 'Prisma',
                version: 'v5.19.0',
                rating: '4.9',
                downloads: '8.7M',
                icon: '▲',
                iconBg: 'bg-teal-600/20 text-teal-400',
                desc: 'Schema formatting, database migration tools, linting, and autocomplete for Prisma models.',
                recommended: false,
              },
              {
                id: 'rust',
                name: 'Rust Analyzer',
                publisher: 'rust-lang.org',
                version: 'v0.3.2100',
                rating: '4.9',
                downloads: '5.2M',
                icon: 'RS',
                iconBg: 'bg-orange-600/20 text-orange-400',
                desc: 'Cargo workspace support, macro expansions, type hints, and Rust compiler diagnostics.',
                recommended: false,
              },
            ]
              .filter(ext => {
                const info = installedExtensions[ext.id] || { installed: false, enabled: false };
                if (extensionFilter === 'installed' && !info.installed) return false;
                if (extensionFilter === 'recommended' && !ext.recommended) return false;
                if (!extensionSearch.trim()) return true;
                const q = extensionSearch.toLowerCase();
                return ext.name.toLowerCase().includes(q) || ext.desc.toLowerCase().includes(q) || ext.publisher.toLowerCase().includes(q);
              })
              .map(ext => {
                const info = installedExtensions[ext.id] || { installed: false, enabled: false };
                return (
                  <div
                    key={ext.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all flex flex-col gap-1.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${ext.iconBg}`}>
                          {ext.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs leading-tight">{ext.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{ext.publisher}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-amber-400 font-mono">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> {ext.rating}
                            </span>
                            <span>•</span>
                            <span>{ext.version}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {info.installed ? (
                          <>
                            <button
                              onClick={() => toggleExtensionEnabled(ext.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                                info.enabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                              title={info.enabled ? 'Click to disable' : 'Click to enable'}
                            >
                              {info.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => toggleExtensionInstalled(ext.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                              title="Uninstall extension"
                            >
                              Uninstall
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => toggleExtensionInstalled(ext.id)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-sm transition cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            Install
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{ext.desc}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Floating File Tree Context Menu */}
      {contextMenu && (
        <div
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            backgroundColor: 'var(--ide-surface-elevated, #121214)',
            borderColor: 'var(--ide-border, #27272a)',
          }}
          className="fixed z-50 border rounded-lg shadow-2xl py-1 min-w-[180px] text-xs text-white/90 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] text-slate-500 font-mono truncate border-b border-white/10 mb-1">
            {contextMenu.node.name}
          </div>
          <button
            onClick={() => {
              setIsCreatingFile(true);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New File</span>
          </button>
          <button
            onClick={() => {
              setIsCreatingFolder(true);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder</span>
          </button>
          <div className="border-t border-white/10 my-1" />
          <button
            onClick={() => {
              navigator.clipboard?.writeText(contextMenu.node.path);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy Path</span>
          </button>
          <button
            onClick={() => {
              const rel = contextMenu.node.path.replace(/^[/\\]+/, '');
              navigator.clipboard?.writeText(rel);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy Relative Path</span>
          </button>
          <div className="border-t border-white/10 my-1" />
          <button
            onClick={() => {
              if (confirm(`Delete ${contextMenu.node.name}?`)) {
                deleteFileOrFolder(contextMenu.node.path);
              }
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
