import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import {
  FileText,
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  FilePlus,
  FolderPlus,
  PanelRight,
  PanelLeft,
  X,
  Sparkles,
  GitBranch,
  Copy,
} from 'lucide-react';
import { FileNode } from '../../types/ide';

export const ExplorerSidebarTab: React.FC = () => {
  const {
    fileTree,
    activeFile,
    activeFileContent,
    openFile,
    createFileOrFolder,
    deleteFileOrFolder,
    modifiedFiles,
    activeProject,
    vfs,
    setIsProjectWizardOpen,
    setIsCloneModalOpen,
    openLocalFolder,
  } = useIDE();

  const layout = useLayout();

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
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter out build artifacts, test dumps (.vitest), and sample fixtures (sample-projects)
  const cleanTree = useMemo(() => {
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
  const outlineSymbols = useMemo(() => {
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

  // Real commits from VFS / Git for Timeline View
  const displayCommits = useMemo(() => {
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

  // Drag-and-drop movement threshold tracking
  const DRAG_THRESHOLD = 4;
  const pointerStartRef = useRef<{ x: number; y: number; didDrag: boolean }>({ x: 0, y: 0, didDrag: false });

  const handlePointerDown = (e: React.MouseEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, didDrag: false };
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      pointerStartRef.current.didDrag = true;
    }
  };

  const handleFileDragStart = (e: React.DragEvent, node: FileNode) => {
    if (node.type === 'folder') return;
    setDraggingPath(node.path);
    e.dataTransfer.setData('text/plain', node.path);
    e.dataTransfer.setData('application/x-vertex-filepath', node.path);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleFileDragEnd = () => {
    setDraggingPath(null);
  };

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    createFileOrFolder(newItemName.trim(), isCreatingFolder ? 'folder' : 'file');
    setNewItemName('');
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'json':
        return <FileText className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'css':
      case 'scss':
        return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'html':
        return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
      case 'md':
        return <FileText className="w-4 h-4 text-indigo-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isFolder = node.type === 'folder';
      const isCollapsed = collapsedFolders[node.path];
      const isSelected = activeFile === node.path;
      const isModified = modifiedFiles?.some((f: any) =>
        typeof f === 'string' ? f === node.path : f?.path === node.path
      );
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

  return (
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
          className="px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer text-slate-400 hover:text-slate-200 transition"
        >
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
            {isOutlineOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Outline</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {outlineSymbols.length} Symbols
          </span>
        </div>

        {/* Outline Content */}
        {isOutlineOpen && (
          <div className="max-h-48 overflow-y-auto py-1 bg-slate-950/40">
            {outlineSymbols.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                {activeFile ? 'No symbols found in active file' : 'No file currently open'}
              </div>
            ) : (
              outlineSymbols.map((sym, idx) => (
                <div
                  key={idx}
                  className="px-4 py-1 hover:bg-white/5 flex items-center justify-between text-[11px] text-slate-300 cursor-pointer"
                  onClick={() => {
                    if (activeFile) openFile(activeFile);
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                      {sym.type[0]}
                    </span>
                    <span className="truncate">{sym.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    L{sym.line}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Timeline Header */}
        <div
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          className="px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer text-slate-400 hover:text-slate-200 transition"
        >
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
            {isTimelineOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Timeline</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {displayCommits.length} Commits
          </span>
        </div>

        {/* Timeline Content */}
        {isTimelineOpen && (
          <div className="max-h-44 overflow-y-auto py-1 bg-slate-950/40">
            {displayCommits.map((cmt, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 hover:bg-white/5 flex flex-col gap-0.5 border-b border-slate-900 last:border-b-0 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-indigo-400 font-bold">{cmt.hash}</span>
                  <span className="text-[10px] text-slate-500">{cmt.time}</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate">{cmt.msg}</div>
                <div className="text-[9px] text-slate-500">{cmt.author}</div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              const rel = contextMenu.node.path.replace(/^[\\/]+/, '');
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
