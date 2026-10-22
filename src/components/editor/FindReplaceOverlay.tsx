import React, { useState } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-react';

export interface FindReplaceOverlayProps {
  isFindOpen: boolean;
  setIsFindOpen: (open: boolean) => void;
  findText: string;
  setFindText: (text: string) => void;
  replaceText: string;
  setReplaceText: (text: string) => void;
  findMatches: number[];
  findMatchIndex: number;
  handlePrevMatch: () => void;
  handleNextMatch: () => void;
  handleReplaceOne: () => void;
  handleReplaceAll: () => void;
}

export const FindReplaceOverlay: React.FC<FindReplaceOverlayProps> = ({
  isFindOpen,
  setIsFindOpen,
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  findMatches,
  findMatchIndex,
  handlePrevMatch,
  handleNextMatch,
  handleReplaceOne,
  handleReplaceAll,
}) => {
  const [showReplaceRow, setShowReplaceRow] = useState(false);

  if (!isFindOpen) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-surface-elevated, #121214)',
        borderColor: 'var(--ide-border, #27272a)',
      }}
      className="absolute top-10 right-4 z-40 border rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 min-w-[320px] text-xs backdrop-blur-xl animate-fadeIn"
    >
      {/* Find Row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowReplaceRow(!showReplaceRow)}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition cursor-pointer"
          title="Toggle Replace"
        >
          {showReplaceRow ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            autoFocus
            placeholder="Find in file..."
            value={findText}
            onChange={e => setFindText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (e.shiftKey) handlePrevMatch();
                else handleNextMatch();
              } else if (e.key === 'Escape') {
                setIsFindOpen(false);
              }
            }}
            className="w-full bg-black/60 border border-white/15 focus:border-[var(--ide-accent,#00ff88)] rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none pr-16"
          />
          <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-mono">
            {findMatches.length > 0 ? `${findMatchIndex + 1}/${findMatches.length}` : findText ? '0/0' : ''}
          </span>
        </div>
        <button
          onClick={handlePrevMatch}
          disabled={findMatches.length === 0}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
          title="Previous Match (Shift+Enter)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleNextMatch}
          disabled={findMatches.length === 0}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
          title="Next Match (Enter)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsFindOpen(false)}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
          title="Close (Escape)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace Row */}
      {showReplaceRow && (
        <div className="flex items-center gap-1.5 pl-6 pt-1 border-t border-white/10">
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            className="flex-1 bg-black/60 border border-white/15 focus:border-[var(--ide-accent,#00ff88)] rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <button
            onClick={handleReplaceOne}
            disabled={findMatches.length === 0}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-medium disabled:opacity-30 cursor-pointer"
            title="Replace Next"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={findMatches.length === 0}
            className="px-2 py-1 bg-[var(--ide-accent,#00ff88)]/20 hover:bg-[var(--ide-accent,#00ff88)]/30 text-[var(--ide-accent,#00ff88)] border border-[var(--ide-accent,#00ff88)]/40 rounded text-[10px] font-bold disabled:opacity-30 cursor-pointer"
            title="Replace All"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
};
