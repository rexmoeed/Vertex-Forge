import React, { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { GitTag as GitTagType } from '../../types/gitWorkflow';

export interface GitTagsTabProps {
  tags: GitTagType[];
  onCreateTag: (tagName: string) => Promise<void>;
  onDeleteTag: (tagName: string) => Promise<void>;
}

export const GitTagsTab: React.FC<GitTagsTabProps> = ({
  tags,
  onCreateTag,
  onDeleteTag,
}) => {
  const [tagName, setTagName] = useState('');

  const handleCreate = async () => {
    if (!tagName.trim()) return;
    await onCreateTag(tagName.trim());
    setTagName('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Create Tag</span>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="v1.0.0..."
            value={tagName}
            onChange={e => setTagName(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            onClick={handleCreate}
            disabled={!tagName.trim()}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-medium shadow flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Tag
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tags ({tags.length})</span>
        {tags.length === 0 ? (
          <div className="p-4 text-center text-slate-500 italic border border-slate-800/80 rounded">
            No tags released yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {tags.map(t => (
              <div
                key={t.name}
                className="flex items-center justify-between p-2 rounded bg-slate-800/40 border border-slate-700/40 hover:border-slate-600"
              >
                <div className="flex items-center gap-2 truncate">
                  <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-mono text-slate-200">{t.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{t.commitHash?.slice(0, 7)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDeleteTag(t.name)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400"
                    title="Delete Tag"
                  >
                    <Trash2 className="w-3 h-3" />
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
