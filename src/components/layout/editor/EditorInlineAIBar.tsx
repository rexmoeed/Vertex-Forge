import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';

interface EditorInlineAIBarProps {
  inlinePrompt: string;
  setInlinePrompt: (prompt: string) => void;
  isInlineLoading: boolean;
  inlineResultNotice: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

export const EditorInlineAIBar: React.FC<EditorInlineAIBarProps> = ({
  inlinePrompt,
  setInlinePrompt,
  isInlineLoading,
  inlineResultNotice,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="absolute top-3 left-16 right-4 z-30 max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-3 shadow-2xl animate-fadeIn">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-semibold text-xs text-slate-100 font-sans">
            Antigravity Inline Assistant
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-mono">
            Gemini 3.8 Flash
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="pt-2 flex flex-col gap-2 font-sans">
        <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 focus-within:border-indigo-500/60 rounded-lg px-2.5 py-1.5 transition-all shadow-inner">
          <input
            type="text"
            value={inlinePrompt}
            onChange={(e) => setInlinePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit();
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Ask AI to edit, refactor, generate code, or fix errors in this file..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none font-mono"
            autoFocus
          />
          <button
            disabled={isInlineLoading || !inlinePrompt.trim()}
            onClick={onSubmit}
            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-[11px] shrink-0 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
          >
            {isInlineLoading ? <span>Generating...</span> : <span>Apply</span>}
          </button>
        </div>

        {/* Quick AI Prompt Pills */}
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {[
            'Refactor & Clean Code',
            'Add Strict TypeScript Types',
            'Optimize Performance',
            'Add Unit Tests',
            'Add Error Handling',
          ].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setInlinePrompt(chip);
              }}
              className="px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-indigo-900/50 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition-colors cursor-pointer"
            >
              ✦ {chip}
            </button>
          ))}
        </div>

        {inlineResultNotice && (
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 font-mono">
            <Check className="w-3 h-3" />
            <span>{inlineResultNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};
