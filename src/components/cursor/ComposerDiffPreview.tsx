import React from 'react';
import { FileCode } from 'lucide-react';
import { ProposedFileChange } from '../../types/desktop';

interface ComposerDiffPreviewProps {
  currentChange: ProposedFileChange | undefined;
  selectedFileIndex: number;
  onToggleAcceptFile: (idx: number) => void;
}

export const ComposerDiffPreview: React.FC<ComposerDiffPreviewProps> = ({
  currentChange,
  selectedFileIndex,
  onToggleAcceptFile,
}) => {
  if (!currentChange) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
        Select a file to inspect diff
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
      <div className="h-9 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/60 text-xs shrink-0">
        <div className="flex items-center gap-2 truncate font-mono text-[11px] text-slate-200">
          <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold truncate">{currentChange.filePath}</span>
          <span className="text-slate-500">—</span>
          <span className="text-slate-400 text-[10px] font-sans truncate">
            {currentChange.explanation}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleAcceptFile(selectedFileIndex)}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
              currentChange.accepted
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {currentChange.accepted ? '✓ Included' : 'Excluded'}
          </button>
        </div>
      </div>

      {/* Diff Code Area */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-5 select-text">
        <div className="space-y-0.5">
          {currentChange.newContent.split('\n').map((line, i) => {
            const isAdded = !currentChange.originalContent || !currentChange.originalContent.includes(line);
            return (
              <div
                key={i}
                className={`flex items-start px-2 py-0.2 rounded-xs ${
                  isAdded ? 'bg-emerald-950/40 text-emerald-200 font-medium' : 'text-slate-300'
                }`}
              >
                <span className="w-8 text-right text-slate-600 select-none pr-3 text-[10px]">
                  {i + 1}
                </span>
                <span className="w-4 select-none text-[11px]">
                  {isAdded ? '+' : ' '}
                </span>
                <span className="flex-1 whitespace-pre">{line || ' '}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
