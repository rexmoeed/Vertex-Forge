import React from 'react';
import { RefreshCw } from 'lucide-react';
import { GitCommitInfo } from '../../types/gitWorkflow';

export interface GitHistoryTabProps {
  commits: GitCommitInfo[];
  onRefresh: () => void;
  onCherryPick: (hash: string) => void;
  onRevert: (hash: string) => void;
}

export const GitHistoryTab: React.FC<GitHistoryTabProps> = ({
  commits,
  onRefresh,
  onCherryPick,
  onRevert,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1 font-semibold">
        <span>Recent Commits ({commits.length})</span>
        <button onClick={onRefresh} className="hover:text-white" title="Refresh commit history">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {commits.length === 0 && (
        <div className="p-4 text-center text-xs text-slate-500">
          No commit history available.
        </div>
      )}

      {commits.map(commit => (
        <div
          key={commit.hash}
          className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5 text-xs hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-indigo-400 font-bold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
              {commit.shortHash}
            </span>
            <span className="text-[10px] text-slate-400">{commit.relativeTime}</span>
          </div>

          <p className="text-slate-200 font-medium line-clamp-2 leading-tight">
            {commit.message}
          </p>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span className="truncate">{commit.author}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onCherryPick(commit.hash)}
                className="px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors"
                title="Cherry-pick this commit"
              >
                Cherry-pick
              </button>
              <button
                onClick={() => onRevert(commit.hash)}
                className="px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-rose-600 hover:text-white text-slate-300 transition-colors"
                title="Revert this commit"
              >
                Revert
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
