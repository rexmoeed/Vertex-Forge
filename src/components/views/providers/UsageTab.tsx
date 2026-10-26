import React from 'react';
import { UsageRecord } from '../../../types/aiProvider';

export interface UsageTabProps {
  usageHistory: UsageRecord[];
  totalTokensUsed: number;
  totalCostUsd: number;
  onClearHistory: () => void;
}

export const UsageTab: React.FC<UsageTabProps> = ({
  usageHistory,
  totalTokensUsed,
  totalCostUsd,
  onClearHistory,
}) => {
  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Usage & Cost Tracking</h2>
          <p className="text-xs text-slate-400">
            Live telemetry on input/output tokens, estimated cost, and agent invocation history.
          </p>
        </div>
        <button
          onClick={onClearHistory}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
        >
          Clear History
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Total Tokens</span>
          <span className="text-xl font-mono font-bold text-white mt-2">
            {totalTokensUsed.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Prompt & Completion</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Estimated Cost</span>
          <span className="text-xl font-mono font-bold text-emerald-400 mt-2">
            ${totalCostUsd.toFixed(4)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Based on active provider pricing</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Invocations</span>
          <span className="text-xl font-mono font-bold text-indigo-300 mt-2">
            {usageHistory.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Autonomous agent requests</span>
        </div>
      </div>

      {/* Invocations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 font-bold text-xs text-white">
          Recent Request Log
        </div>
        <div className="divide-y divide-slate-800 text-xs">
          {usageHistory.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No requests recorded yet.</div>
          ) : (
            usageHistory.map(r => (
              <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-850/50">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500">{r.timestamp}</span>
                  <div>
                    <span className="font-semibold text-white">{r.agentRole} Agent</span>
                    <span className="text-[11px] text-slate-400 ml-2">({r.modelId})</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-[11px]">
                  <span className="text-slate-300">{r.inputTokens + r.outputTokens} tok</span>
                  <span className="text-emerald-400">${r.estimatedCostUsd.toFixed(5)}</span>
                  <span className="text-slate-500">{r.durationMs}ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
