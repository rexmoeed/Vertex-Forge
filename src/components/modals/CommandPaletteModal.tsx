import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import { CommandRegistry, Command } from '../../services/commandRegistry';
import {
  Search,
  FileCode,
  ArrowRight,
  Terminal,
  Zap,
} from 'lucide-react';
import { FileNode } from '../../types/ide';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProject: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeProject, openFile, setActiveView, vfs } = useIDE() as any;

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten files for quick open
  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    if (!nodes) return result;
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node);
      }
      if (node.children) {
        result = result.concat(flattenFiles(node.children));
      }
    }
    return result;
  };

  const projectFiles = vfs ? flattenFiles(vfs.getTree()) : flattenFiles(activeProject?.rootFiles || []);

  const isCommandMode = search.startsWith('>');
  const cleanSearch = isCommandMode ? search.slice(1).trim().toLowerCase() : search.trim().toLowerCase();

  const matchingFiles = cleanSearch && !isCommandMode
    ? projectFiles.filter(f => f.path.toLowerCase().includes(cleanSearch) || f.name.toLowerCase().includes(cleanSearch))
    : [];

  const matchingCommands = CommandRegistry.search(cleanSearch);

  const totalResults = [
    ...matchingFiles.map(f => ({ type: 'file' as const, item: f })),
    ...matchingCommands.map(c => ({ type: 'command' as const, item: c })),
  ];

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalResults.length) % Math.max(1, totalResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = totalResults[selectedIndex];
      if (current) {
        if (current.type === 'file') {
          openFile((current.item as FileNode).path);
          setActiveView('editor');
          onClose();
        } else {
          const cmd = current.item as Command;
          onClose();
          await CommandRegistry.execute(cmd.id);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[540px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-950/70">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a file name to open, or '>' for commands..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">ESC to close</span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {matchingFiles.length > 0 && (
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Workspace Files ({matchingFiles.length})
            </div>
          )}

          {matchingFiles.slice(0, 8).map((file, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <div
                key={file.path}
                onClick={() => {
                  openFile(file.path);
                  setActiveView('editor');
                  onClose();
                }}
                className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                  <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="font-medium text-white truncate shrink-0 max-w-[160px]">{file.name}</span>
                  <span className={`text-[11px] truncate min-w-0 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {file.path}
                  </span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
              </div>
            );
          })}

          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
            Studio Commands ({matchingCommands.length})
          </div>

          {matchingCommands.map((cmd, idx) => {
            const overallIndex = matchingFiles.length + idx;
            const isSelected = selectedIndex === overallIndex;
            return (
              <div
                key={cmd.id}
                onClick={async () => {
                  onClose();
                  await CommandRegistry.execute(cmd.id);
                }}
                className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                  <div className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-indigo-400'
                  }`}>
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col truncate min-w-0 flex-1">
                    <span className="font-medium text-white truncate">{cmd.title}</span>
                    <span className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {cmd.category} — {cmd.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cmd.shortcut && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      isSelected ? 'bg-indigo-700/50 text-indigo-100 border-indigo-400/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {cmd.shortcut}
                    </span>
                  )}
                  <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> Navigate</span>
            <span><strong>Enter</strong> Select</span>
            <span><strong>Esc</strong> Dismiss</span>
          </div>
          <span className="font-mono text-[10px] text-indigo-400">Desktop Command Registry: Synchronized</span>
        </div>
      </div>
    </div>
  );
};
