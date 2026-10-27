import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';

interface EditorDiffReviewBarProps {
  diffMode: boolean;
  onToggleDiffMode: () => void;
  onReject: () => void;
  onAccept: () => void;
}

export const EditorDiffReviewBar: React.FC<EditorDiffReviewBarProps> = ({
  diffMode,
  onToggleDiffMode,
  onReject,
  onAccept,
}) => {
  return (
    <div className="absolute top-2 left-16 right-4 z-40 max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-indigo-500/70 rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-between animate-fadeIn text-xs">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-bold text-white">Cursor Inline Diff Review</span>
        <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          Changes Ready
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDiffMode}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-[11px] transition-colors cursor-pointer"
          title="Toggle Split Diff View"
        >
          {diffMode ? 'Editor' : 'Compare'}
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
          title="Reject and Restore Original (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
        <button
          onClick={onAccept}
          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1 cursor-pointer"
          title="Accept and Save (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
};
