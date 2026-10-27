import React from 'react';
import { FilePlus, FolderPlus, Copy, Trash2 } from 'lucide-react';
import { FileNode } from '../../../types/ide';

interface ExplorerContextMenuProps {
  contextMenu: { x: number; y: number; node: FileNode } | null;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onDelete: (path: string, name: string) => void;
}

export const ExplorerContextMenu: React.FC<ExplorerContextMenuProps> = ({
  contextMenu,
  onClose,
  onNewFile,
  onNewFolder,
  onDelete,
}) => {
  if (!contextMenu) return null;

  return (
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
          onNewFile();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
      >
        <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
        <span>New File</span>
      </button>
      <button
        onClick={() => {
          onNewFolder();
          onClose();
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
          onClose();
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
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
      >
        <Copy className="w-3.5 h-3.5 text-slate-400" />
        <span>Copy Relative Path</span>
      </button>
      <div className="border-t border-white/10 my-1" />
      <button
        onClick={() => {
          onDelete(contextMenu.node.path, contextMenu.node.name);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 cursor-pointer transition"
      >
        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
        <span>Delete</span>
      </button>
    </div>
  );
};
