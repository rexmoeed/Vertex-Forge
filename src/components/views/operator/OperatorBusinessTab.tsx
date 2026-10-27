import React from 'react';
import type { useOperatorConsole } from '../../../hooks/useOperatorConsole';
import { TrackerStatus } from '../../../types/kos';

interface Props {
  activeBiz: ReturnType<typeof useOperatorConsole>['activeBiz'];
  trackerItems: ReturnType<typeof useOperatorConsole>['trackerItems'];
  onMoveTask: (id: string, status: any) => void;
}

export const OperatorBusinessTab: React.FC<Props> = ({ activeBiz, trackerItems, onMoveTask }) => {
  return (
    <div className="max-w-6xl flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-white">Business Trackers ({activeBiz.name})</h2>
        <p className="text-xs text-slate-400">
          Workspaces and agent tasks organized by business entities with complete memory & budget boundary isolation.
        </p>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {(['backlog', 'in_progress', 'review', 'done'] as TrackerStatus[]).map(statusCol => {
          const items = trackerItems.filter(i => i.status === statusCol);
          return (
            <div key={statusCol} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2.5 min-h-[300px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wide text-slate-300 font-mono">
                  {statusCol.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {items.map(t => (
                  <div key={t.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-xs flex flex-col gap-1.5 shadow-xs">
                    <span className="font-bold text-slate-200">{t.title}</span>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{t.description}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[9px]">
                      <span className="text-amber-400 font-mono uppercase">{t.priority}</span>
                      <div className="flex gap-1">
                        {statusCol !== 'done' && (
                          <button
                            onClick={() => onMoveTask(t.id, statusCol === 'backlog' ? 'in_progress' : statusCol === 'in_progress' ? 'review' : 'done')}
                            className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                          >
                            Advance &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
