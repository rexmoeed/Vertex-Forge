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
} from 'lucide-react';
import { FileNode } from '../../types/ide';
import { ExplorerContextMenu } from './explorer/ExplorerContextMenu';
import { NoFolderOpenedView } from './explorer/NoFolderOpenedView';
import { OutlineTimelineSection } from './explorer/OutlineTimelineSection';

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

  // File Context Menu State
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
              if (pointerStartRef.current.didDrag) return;
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
        <NoFolderOpenedView
          onOpenLocalFolder={() => openLocalFolder()}
          onOpenProjectWizard={() => setIsProjectWizardOpen(true)}
          onOpenCloneModal={() => setIsCloneModalOpen(true)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto py-1">{renderTree(cleanTree)}</div>
      )}

      {/* Outline & Timeline Section */}
      <OutlineTimelineSection
        activeFile={activeFile}
        activeFileContent={activeFileContent}
        vfs={vfs}
        onOpenFile={openFile}
      />

      {/* Floating File Tree Context Menu */}
      <ExplorerContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onNewFile={() => setIsCreatingFile(true)}
        onNewFolder={() => setIsCreatingFolder(true)}
        onDelete={(path, name) => {
          if (confirm(`Delete ${name}?`)) {
            deleteFileOrFolder(path);
          }
        }}
      />
    </div>
  );
};
