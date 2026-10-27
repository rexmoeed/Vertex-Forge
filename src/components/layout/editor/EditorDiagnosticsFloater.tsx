import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { ProblemDiagnostic } from '../../../types/ide';

interface EditorDiagnosticsFloaterProps {
  diagnostic: ProblemDiagnostic;
  onFixWithAI: (errorDetails?: string) => void;
}

export const EditorDiagnosticsFloater: React.FC<EditorDiagnosticsFloaterProps> = ({
  diagnostic,
  onFixWithAI,
}) => {
  return (
    <div className="absolute bottom-3 right-4 max-w-md bg-slate-900/95 border border-rose-500/40 rounded-xl p-3 shadow-xl backdrop-blur-sm z-20 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Diagnostic Found (Line {diagnostic.line})</span>
        </div>
        <button
          onClick={() => onFixWithAI(diagnostic.message)}
          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow cursor-pointer"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>Fix with AI</span>
        </button>
      </div>
      <p className="text-[11px] text-slate-300 font-mono leading-tight">{diagnostic.message}</p>
    </div>
  );
};
