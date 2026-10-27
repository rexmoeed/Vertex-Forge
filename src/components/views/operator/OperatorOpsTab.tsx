import React from 'react';
import { UnifiedAuditEvent, OpsRealtimeSnapshot } from '../../types/kos';

interface Props {
  opsSnapshot: OpsRealtimeSnapshot;
  auditTrail: UnifiedAuditEvent[];
}

export const OperatorOpsTab: React.FC<Props> = ({ opsSnapshot, auditTrail }) => {
  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-white">Operations Dashboard & Audit Trail</h2>
        <p className="text-xs text-slate-400">
          Real-time governance metrics and append-only audit log across all agent executions.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono">ACTIVE JOBS</div>
          <div className="text-lg font-bold text-white mt-1">{opsSnapshot.activeJobs}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono">PENDING APPROVALS</div>
          <div className="text-lg font-bold text-amber-400 mt-1">{opsSnapshot.pendingApprovals}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono">SESSION COST</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">${opsSnapshot.totalCostUsdSession.toFixed(4)}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-mono">HEALTH SCORE</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">{opsSnapshot.nodeHealthScore}%</div>
        </div>
      </div>

      {/* Audit Trail */}
      <div>
        <h3 className="text-xs font-bold text-white mb-2">Unified Audit Stream</h3>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {auditTrail.map(event => (
            <div key={event.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    event.source === 'rulebook'
                      ? 'bg-rose-500/20 text-rose-400'
                      : event.source === 'vault'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  {event.source}
                </span>
                <span className="text-slate-200">{event.details}</span>
              </div>
              <span className="text-slate-500 text-[10px]">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
