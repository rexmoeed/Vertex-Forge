import React from 'react';
import { Trash2 } from 'lucide-react';
import { UsageRecord } from '../../../types/aiProviders';

export interface UsageTabProps {
  usageRecords: UsageRecord[];
  onClearUsage: () => void;
  totalCostUsd: number;
}

export const UsageTab: React.FC<UsageTabProps> = ({
  usageRecords,
  onClearUsage,
  totalCostUsd,
}) => {
  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Token Usage & Cost Telemetry</h2>
          <p className="text-xs text-slate-400">
            Granular consumption analytics across local and cloud models.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
            Total: ${totalCostUsd.toFixed(4)}
          </div>
          {usageRecords.length > 0 && (
            <button
              onClick={onClearUsage}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
              title="Clear Usage History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {usageRecords.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
          No token usage recorded yet. Calls made to AI providers will be tracked here.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="p-3">Model</th>
                <th className="p-3">Prompt Tokens</th>
                <th className="p-3">Completion</th>
                <th className="p-3">Cost ($)</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
              {usageRecords.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="p-3 font-sans font-medium text-white">{rec.modelId}</td>
                  <td className="p-3">{rec.promptTokens.toLocaleString()}</td>
                  <td className="p-3">{rec.completionTokens.toLocaleString()}</td>
                  <td className="p-3">${rec.costUsd.toFixed(5)}</td>
                  <td className="p-3 text-slate-500">{new Date(rec.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
