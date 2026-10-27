import React from 'react';
import { Users } from 'lucide-react';
import { CouncilSession } from '../../types/kos';

interface Props {
  councilSessions: CouncilSession[];
  councilTopic: string;
  setCouncilTopic: (val: string) => void;
  isConveningCouncil: boolean;
  onConveneCouncil: () => void;
}

export const OperatorCouncilTab: React.FC<Props> = ({
  councilSessions,
  councilTopic,
  setCouncilTopic,
  isConveningCouncil,
  onConveneCouncil,
}) => {
  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-white">Multi-AI Council</h2>
        <p className="text-xs text-slate-400">
          Deliberate high-impact architectural changes across multiple foundation models simultaneously.
        </p>
      </div>

      {/* Convene Council Toolbar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex gap-2">
        <input
          type="text"
          placeholder="Enter topic or architectural decision to deliberate..."
          value={councilTopic}
          onChange={e => setCouncilTopic(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
        />
        <button
          onClick={onConveneCouncil}
          disabled={isConveningCouncil}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isConveningCouncil ? 'Deliberating...' : 'Convene Council'}</span>
        </button>
      </div>

      {/* Council Sessions List */}
      <div className="space-y-4">
        {councilSessions.map(session => (
          <div key={session.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Topic: {session.topic}</span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                  session.finalVerdict === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {session.finalVerdict}
              </span>
            </div>

            <p className="text-xs text-slate-300 bg-black/40 p-2.5 rounded-lg border border-white/5 font-mono">
              {session.consensusSummary}
            </p>

            {/* Individual Model Votes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {session.votes.map((v, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] flex flex-col gap-1">
                  <div className="flex items-center justify-between font-bold text-slate-200">
                    <span>{v.memberModel}</span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        v.decision === 'approve'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : v.decision === 'reject'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {v.decision}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] line-clamp-3">{v.reasoning}</p>
                  <div className="text-slate-500 text-[9px] mt-1 font-mono">
                    Latency: {v.latencyMs}ms | Cost: ${v.estimatedCostUsd.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
