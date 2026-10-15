import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  ArrowUp,
  HardDrive,
  Home,
  Monitor,
  FileText,
  Download,
  Search,
  X,
  ChevronRight,
  Check,
  RotateCw,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface BrowseResponse {
  currentPath: string;
  parentPath: string | null;
  isRoot: boolean;
  breadcrumbs: Array<{ name: string; path: string }>;
  folders: Array<{ name: string; path: string; hasSubfolders: boolean }>;
  drives: string[];
  shortcuts: Array<{ name: string; path: string }>;
}

interface OpenFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderPath: string) => void;
  initialPath?: string;
}

export const OpenFolderModal: React.FC<OpenFolderModalProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  initialPath,
}) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath || '.');
  const [data, setData] = useState<BrowseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [manualPathInput, setManualPathInput] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderInList, setSelectedFolderInList] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<Array<{ name: string; path: string; timestamp: number }>>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent projects from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vertex_recent_workspaces_v2');
      if (stored) {
        setRecentProjects(JSON.parse(stored).slice(0, 5));
      }
    } catch {}
  }, [isOpen]);

  const getApiUrl = (endpoint: string) => {
    if (typeof window !== 'undefined' && (window.location.protocol === 'file:' || !window.location.origin.startsWith('http'))) {
      return `http://127.0.0.1:3000${endpoint}`;
    }
    return endpoint;
  };

  // Fetch directory listing from backend
  const fetchDirectory = async (targetPath: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/fs/browse-dirs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPath: targetPath }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to read directory (${res.status})`);
      }

      const browseData: BrowseResponse = await res.json();
      setData(browseData);
      setCurrentPath(browseData.currentPath);
      setManualPathInput(browseData.currentPath);
      setSelectedFolderInList(null);
      setSearchQuery('');
    } catch (err: any) {
      setError(err?.message || 'Unable to open directory path.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDirectory(initialPath || '.');
    }
  }, [isOpen, initialPath]);

  // Handle keyboard shortcuts (Escape = close, Enter = select or enter folder)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreatingFolder) {
          setIsCreatingFolder(false);
        } else if (isEditingPath) {
          setIsEditingPath(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCreatingFolder, isEditingPath, onClose]);

  if (!isOpen) return null;

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const target = `${currentPath}/${newFolderName.trim()}`;
      const res = await fetch(getApiUrl('/api/fs/create-dir'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: target }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create folder');
      }

      setIsCreatingFolder(false);
      setNewFolderName('');
      await fetchDirectory(target);
    } catch (err: any) {
      setError(err?.message || 'Could not create new folder');
    }
  };

  const handleConfirmSelect = () => {
    const finalPath = selectedFolderInList || currentPath;
    onSelectFolder(finalPath);
    onClose();
  };

  const filteredFolders = (data?.folders || []).filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-fadeIn">
      <div
        style={{
          backgroundColor: 'var(--ide-surface, #121214)',
          borderColor: 'var(--ide-border, #27272a)',
          color: 'var(--ide-text, #f4f4f5)',
        }}
        className="w-full max-w-2xl h-[560px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden text-xs"
      >
        {/* Header */}
        <div
          style={{ borderColor: 'var(--ide-border, #27272a)' }}
          className="p-4 border-b flex items-center justify-between bg-black/30 shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Open Workspace Folder
                <span className="text-[10px] font-normal text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Zero Native Dialogs
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Browse machine filesystem and select project root
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {typeof window !== 'undefined' && !!(window as any).desktopAPI?.openDirectoryDialog && (
              <button
                type="button"
                onClick={async () => {
                  const nativeFolder = await (window as any).desktopAPI.openDirectoryDialog();
                  if (nativeFolder) {
                    onSelectFolder(nativeFolder);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                title="Browse using Windows native File Explorer dialog"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Windows Explorer Picker</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shortcuts Bar (Drives & System Folders) */}
        <div
          style={{ borderColor: 'var(--ide-border, #27272a)' }}
          className="px-4 py-2 border-b flex flex-wrap items-center gap-1.5 bg-black/20 shrink-0"
        >
          {data?.shortcuts.map(s => {
            const isDesktop = s.name === 'Desktop';
            const isHome = s.name === 'Home';
            const isDocs = s.name === 'Documents';
            const isDownloads = s.name === 'Downloads';
            const isCur = s.name === 'Current Project';

            return (
              <button
                key={s.path}
                onClick={() => fetchDirectory(s.path)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                  currentPath === s.path
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={s.path}
              >
                {isDesktop && <Monitor className="w-3 h-3 text-cyan-400" />}
                {isHome && <Home className="w-3 h-3 text-indigo-400" />}
                {isDocs && <FileText className="w-3 h-3 text-amber-400" />}
                {isDownloads && <Download className="w-3 h-3 text-emerald-400" />}
                {isCur && <ShieldCheck className="w-3 h-3 text-violet-400" />}
                <span>{s.name}</span>
              </button>
            );
          })}

          {/* Drives */}
          {data?.drives && data.drives.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              {data.drives.map(d => (
                <button
                  key={d}
                  onClick={() => fetchDirectory(d)}
                  className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  <HardDrive className="w-2.5 h-2.5 text-slate-400" />
                  <span>{d}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Path Navigation & Breadcrumb Bar */}
        <div
          style={{ borderColor: 'var(--ide-border, #27272a)' }}
          className="p-3 border-b flex items-center gap-2 bg-black/10 shrink-0"
        >
          {/* Up directory button */}
          <button
            onClick={() => data?.parentPath && fetchDirectory(data.parentPath)}
            disabled={!data?.parentPath}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Go to parent directory"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          {/* Breadcrumb or Manual Path Input */}
          <div className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 flex items-center gap-1 text-[11px] overflow-hidden">
            {isEditingPath ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setIsEditingPath(false);
                  fetchDirectory(manualPathInput);
                }}
                className="flex-1 flex items-center"
              >
                <input
                  type="text"
                  value={manualPathInput}
                  onChange={e => setManualPathInput(e.target.value)}
                  onBlur={() => setIsEditingPath(false)}
                  autoFocus
                  className="w-full bg-transparent text-white font-mono text-[11px] outline-none"
                />
              </form>
            ) : (
              <div
                onClick={() => setIsEditingPath(true)}
                className="flex-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap cursor-text py-0.5 scrollbar-none"
                title="Click to edit path directly"
              >
                {data?.breadcrumbs.map((b, i) => (
                  <React.Fragment key={b.path}>
                    {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        fetchDirectory(b.path);
                      }}
                      className="hover:underline text-slate-300 hover:text-white font-mono cursor-pointer shrink-0"
                    >
                      {b.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* New Folder & Refresh */}
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Create new folder here"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => fetchDirectory(currentPath)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Refresh folder view"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Inline Folder Creation Form */}
        {isCreatingFolder && (
          <form
            onSubmit={handleCreateFolder}
            className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center gap-2 shrink-0 animate-fadeIn"
          >
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              autoFocus
              className="flex-1 bg-black/50 border border-indigo-500/50 rounded px-2.5 py-1 text-xs text-white outline-none font-mono"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[11px] cursor-pointer"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2 py-1 text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Search Filter Bar */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter subfolders in current directory..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Directory Contents List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-3 space-y-1 select-none min-h-0"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs my-2">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
              <RotateCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Reading folder structure...</span>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-1.5">
              <Folder className="w-8 h-8 opacity-30" />
              <span>{searchQuery ? 'No folders match your filter.' : 'No subfolders in this directory.'}</span>
              <span className="text-[10px] text-slate-600">You can select this directory directly below.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredFolders.map(folder => {
                const isSelected = selectedFolderInList === folder.path;
                return (
                  <div
                    key={folder.path}
                    onClick={() => setSelectedFolderInList(folder.path)}
                    onDoubleClick={() => fetchDirectory(folder.path)}
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/80 text-white shadow-xs'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate font-mono text-[11px]">{folder.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          fetchDirectory(folder.path);
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-white/15 cursor-pointer"
                        title="Enter folder"
                      >
                        Enter →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Workspaces Quick Open Bar */}
        {recentProjects.length > 0 && (
          <div
            style={{ borderColor: 'var(--ide-border, #27272a)' }}
            className="px-4 py-2 border-t flex items-center gap-2 bg-black/20 shrink-0 text-[11px]"
          >
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-400 shrink-0">Recent:</span>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {recentProjects.map(proj => (
                <button
                  key={proj.path}
                  onClick={() => {
                    onSelectFolder(proj.path);
                    onClose();
                  }}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white truncate max-w-[140px] font-mono cursor-pointer shrink-0"
                  title={`Open ${proj.path}`}
                >
                  {proj.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        <div
          style={{ borderColor: 'var(--ide-border, #27272a)' }}
          className="p-3.5 border-t flex items-center justify-between gap-3 bg-black/40 shrink-0"
        >
          <div className="min-w-0 flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span className="shrink-0 font-medium text-slate-300">Target Folder:</span>
            <span className="font-mono text-cyan-300 truncate max-w-[320px]">
              {selectedFolderInList || currentPath}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelect}
              style={{ backgroundColor: 'var(--ide-accent, #6366f1)' }}
              className="px-4 py-1.5 rounded-lg text-white font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select This Folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
