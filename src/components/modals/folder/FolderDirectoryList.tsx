import React from 'react';
import { Folder, RotateCw } from 'lucide-react';

interface FolderItem {
  name: string;
  path: string;
  hasSubfolders: boolean;
}

interface FolderDirectoryListProps {
  listRef: React.RefObject<HTMLDivElement | null>;
  error: string | null;
  loading: boolean;
  searchQuery: string;
  filteredFolders: FolderItem[];
  selectedFolderInList: string | null;
  onSelectFolder: (path: string) => void;
  onEnterFolder: (path: string) => void;
}

export const FolderDirectoryList: React.FC<FolderDirectoryListProps> = ({
  listRef,
  error,
  loading,
  searchQuery,
  filteredFolders,
  selectedFolderInList,
  onSelectFolder,
  onEnterFolder,
}) => {
  return (
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
                onClick={() => onSelectFolder(folder.path)}
                onDoubleClick={() => onEnterFolder(folder.path)}
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
                      onEnterFolder(folder.path);
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
  );
};
