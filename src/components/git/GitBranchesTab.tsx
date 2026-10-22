import React, { useState } from 'react';
import { GitBranch as GitBranchIcon, Plus, Trash2, GitMerge } from 'lucide-react';
import { GitBranch as GitBranchType } from '../../types/gitWorkflow';

export interface GitBranchesTabProps {
  branches: GitBranchType[];
  currentBranch: string;
  onCreateBranch: (branchName: string) => Promise<void>;
  onSwitchBranch: (branchName: string) => Promise<void>;
  onDeleteBranch: (branchName: string) => Promise<void>;
  onMerge: (sourceBranch: string) => Promise<void>;
}

export const GitBranchesTab: React.FC<GitBranchesTabProps> = ({
  branches,
  currentBranch,
  onCreateBranch,
  onSwitchBranch,
  onDeleteBranch,
  onMerge,
}) => {
  const [newBranchInput, setNewBranchInput] = useState('');

  const handleCreate = async () => {
    if (!newBranchInput.trim()) return;
    await onCreateBranch(newBranchInput.trim());
    setNewBranchInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 text-xs">
      {/* Create Branch */}
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold text-slate-300 text-[11px]">New Branch</label>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="feature/branch-name"
            value={newBranchInput}
            onChange={e => setNewBranchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
          />
          <button
            onClick={handleCreate}
            disabled={!newBranchInput.trim()}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create
          </button>
        </div>
      </div>

      {/* Local Branches List */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
          <span>Branches ({branches.length})</span>
        </div>
        <div className="flex flex-col gap-1">
          {branches.map(b => (
            <div
              key={b.name}
              className={`flex items-center justify-between p-2 rounded border transition-colors ${
                b.isCurrent
                  ? 'bg-indigo-950/40 border-indigo-700/60 text-white'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <GitBranchIcon className={`w-3.5 h-3.5 shrink-0 ${b.isCurrent ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="font-mono text-[11px] truncate">{b.name}</span>
                {b.isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-indigo-900/60 text-indigo-300 rounded border border-indigo-700/50">
                    HEAD
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!b.isCurrent && (
                  <>
                    <button
                      onClick={() => onSwitchBranch(b.name)}
                      className="px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-slate-600 text-[10px] text-slate-300 transition-colors"
                      title="Checkout this branch"
                    >
                      Checkout
                    </button>
                    <button
                      onClick={() => onMerge(b.name)}
                      className="p-1 rounded bg-slate-700/60 hover:bg-amber-600 hover:text-white text-slate-300 transition-colors"
                      title={`Merge ${b.name} into ${currentBranch}`}
                    >
                      <GitMerge className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteBranch(b.name)}
                      className="p-1 rounded bg-slate-700/60 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors"
                      title="Delete branch"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
