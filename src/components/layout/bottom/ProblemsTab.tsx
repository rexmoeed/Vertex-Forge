import React from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { useIDE } from '../../../context/IDEContext';

export const ProblemsTab: React.FC = () => {
  const { problems, runLint, openFile } = useIDE();

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-surface)',
        color: 'var(--ide-text)',
      }}
      className="h-full flex flex-col font-sans text-xs transition-colors duration-150 overflow-y-auto"
    >
      <div
        style={{
          backgroundColor: 'var(--ide-surface-elevated)',
          borderColor: 'var(--ide-border)',
        }}
        className="px-4 py-2 border-b flex items-center justify-between"
      >
        <span className="font-semibold text-xs flex items-center gap-2">
          <span>Problems & Diagnostics</span>
          <span
            style={{
              backgroundColor: problems.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: problems.length > 0 ? '#ef4444' : '#10b981',
            }}
            className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold"
          >
            {problems.length}
          </span>
        </span>
        <button
          onClick={() => runLint()}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <Play className="w-3 h-3" />
          <span>Re-run Lint & Typecheck</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--ide-border)' }}>
        {problems.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--ide-text-muted)' }}>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-xs">No problems found in workspace.</p>
            <p className="text-[11px] mt-0.5 opacity-75">All linters, type checks, and security gates are passing cleanly.</p>
          </div>
        ) : (
          problems.map((p, idx) => (
            <div
              key={idx}
              onClick={() => p.filePath && openFile(p.filePath)}
              className="p-3 hover:opacity-90 flex items-start justify-between gap-4 cursor-pointer transition-opacity"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    p.severity === 'error' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
                <div>
                  <p className="font-mono text-xs text-white">{p.message}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--ide-text-muted)' }}>
                    {p.filePath} {p.line ? `:${p.line}` : ''} {p.source ? `[${p.source}]` : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 opacity-40" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
