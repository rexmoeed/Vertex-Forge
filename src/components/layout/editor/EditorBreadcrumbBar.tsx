import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ProblemDiagnostic } from '../../../types/ide';

interface EditorBreadcrumbBarProps {
  currentFile: string;
  fileDiagnostics: ProblemDiagnostic[];
}

export const EditorBreadcrumbBar: React.FC<EditorBreadcrumbBarProps> = ({
  currentFile,
  fileDiagnostics,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--ide-surface-elevated)',
        borderColor: 'var(--ide-border)',
      }}
      className="h-6 border-b px-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono select-none shrink-0 overflow-hidden min-w-0"
    >
      <div className="flex items-center gap-1 truncate min-w-0 max-w-full">
        <span className="shrink-0">{currentFile.split('/')[0]}</span>
        <span className="shrink-0">&gt;</span>
        <span className="text-slate-800 dark:text-slate-300 font-medium truncate min-w-0">{currentFile}</span>
      </div>

      {fileDiagnostics.length > 0 && (
        <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-sans text-[10px] shrink-0 ml-2">
          <AlertTriangle className="w-3 h-3" />
          <span>
            {fileDiagnostics.length} issue{fileDiagnostics.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};
