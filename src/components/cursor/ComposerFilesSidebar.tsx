import React from 'react';
import { ProposedFileChange } from '../../types/desktop';
import { CursorGenerationResult } from '../../services/cursorService';

interface ComposerFilesSidebarProps {
  generationResult: CursorGenerationResult;
  selectedFileIndex: number;
  onSelectFileIndex: (idx: number) => void;
  onToggleAcceptFile: (idx: number) => void;
}

export const ComposerFilesSidebar: React.FC<ComposerFilesSidebarProps> = ({
  generationResult,
  selectedFileIndex,
  onSelectFileIndex,
  onToggleAcceptFile,
}) => {
  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <span className="font-bold uppercase tracking-wider text-[10px]">
          Changed Files ({generationResult.changes.length})
        </span>
        <span className="text-[10px] text-emerald-400 font-mono font-bold">
          {generationResult.changes.filter(c => c.accepted).length} accepted
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {generationResult.changes.map((chg, idx) => {
          const isSelected = idx === selectedFileIndex;
          return (
            <div
              key={chg.id}
              onClick={() => onSelectFileIndex(idx)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer flex flex-col gap-1 transition-all ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500/70 text-white shadow-sm'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <input
                    type="checkbox"
                    checked={chg.accepted}
                    onChange={e => {
                      e.stopPropagation();
                      onToggleAcceptFile(idx);
                    }}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] truncate font-medium">
                    {chg.filePath}
                  </span>
                </div>
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    chg.action === 'create'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {chg.action}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] pl-5 text-slate-400 font-mono">
                <span className="text-emerald-400">+{chg.additions} -{chg.deletions}</span>
                <span className={chg.accepted ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {chg.accepted ? 'Accepted' : 'Skipped'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
