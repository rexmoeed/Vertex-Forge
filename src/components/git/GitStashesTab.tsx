import React, { useState } from 'react';
import { Archive, Plus } from 'lucide-react';
import { GitStash } from '../../types/gitWorkflow';

export interface GitStashesTabProps {
  stashes: GitStash[];
  onSaveStash: (message: string) => Promise<void>;
  onApplyStash: (index: number, pop: boolean) => Promise<void>;
  onDropStash: (index: number) => Promise<void>;
}

export const GitStashesTab: React.FC<GitStashesTabProps> = ({
  stashes,
  onSaveStash,
  onApplyStash,
  onDropStash,
}) => {
  const [stashMessage, setStashMessage] = useState('');

  const handleSave = async () => {
    await onSaveStash(stashMessage);
    setStashMessage('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Save Stash</span>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Stash description (optional)..."
            value={stashMessage}
            onChange={e => setStashMessage(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Stashed Changes ({stashes.length})
        </span>
        {stashes.length === 0 ? (
          <div className="p-4 text-center text-slate-500 italic border border-slate-800/80 rounded">
            No stashes recorded.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {stashes.map(stash => (
              <div
                key={stash.index}
                className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-2 truncate">
                  <Archive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-mono text-slate-300 truncate">
                    {'stash@{' + stash.index + '}: ' + (stash.message || 'WIP on branch')}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onApplyStash(stash.index, false)}
                    className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-white"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => onApplyStash(stash.index, true)}
                    className="px-2 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-[10px] text-white"
                  >
                    Pop
                  </button>
                  <button
                    onClick={() => onDropStash(stash.index)}
                    className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-[10px] text-rose-200"
                  >
                    Drop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
