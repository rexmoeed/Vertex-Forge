import React from 'react';
import { ApprovalItem } from '../../types/kos';

interface Props {
  approvals: ApprovalItem[];
  onResolveApproval: (id: string, decision: 'approved' | 'rejected') => void;
}

export const OperatorApprovalsTab: React.FC<Props> = ({ approvals, onResolveApproval }) => {
  return (
    <div className="max-w-5xl flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-white">Owner Approval Queue</h2>
        <p className="text-xs text-slate-400">
          Untrusted agents cannot bypass this queue. Risky tool calls, overrides, and budget expenses await explicit owner sign-off.
        </p>
      </div>

      <div className="space-y-3">
        {approvals.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border flex flex-col gap-2.5 transition ${
              item.status === 'pending'
                ? 'bg-slate-900 border-amber-500/40 shadow-sm'
                : item.status === 'approved'
                ? 'bg-slate-900/60 border-emerald-500/30 opacity-75'
                : 'bg-slate-900/60 border-rose-500/30 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">{item.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                  {item.category}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                    item.risk === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : item.risk === 'high'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  {item.risk} risk
                </span>
              </div>

              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                  item.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                    : item.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {item.status}
              </span>
            </div>

            <p className="text-xs text-slate-300">{item.description}</p>

            {item.diffSnippet && (
              <pre className="p-2.5 rounded-lg bg-black/50 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                {item.diffSnippet}
              </pre>
            )}

            {item.status === 'pending' && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onResolveApproval(item.id, 'approved')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Approve & Execute
                </button>
                <button
                  onClick={() => onResolveApproval(item.id, 'rejected')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
