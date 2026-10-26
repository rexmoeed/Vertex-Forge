import React from 'react';
import { ModelInfo, AgentModelOverride } from '../../../types/aiProviders';

export interface AgentOverridesTabProps {
  agentOverrides: AgentModelOverride[];
  onAddAgentOverride: (agentId: string, modelId: string) => void;
  onRemoveAgentOverride: (agentId: string) => void;
  models: ModelInfo[];
}

export const AgentOverridesTab: React.FC<AgentOverridesTabProps> = ({
  agentOverrides,
  onAddAgentOverride,
  onRemoveAgentOverride,
  models,
}) => {
  const agents = [
    { id: 'lead-frontend', name: 'Frontend Architect', defaultModel: 'gemini-3.8-flash' },
    { id: 'lead-backend', name: 'Backend Engineer', defaultModel: 'claude-3-7-sonnet' },
    { id: 'lead-devops', name: 'DevOps & CI Specialist', defaultModel: 'gpt-4o' },
    { id: 'lead-security', name: 'Security Auditor', defaultModel: 'claude-3-7-sonnet' },
  ];

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Agent-Specific Model Overrides</h2>
        <p className="text-xs text-slate-400">
          Assign tailored foundation models to specific autonomous agents for specialized workflows.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {agents.map(a => {
          const override = agentOverrides.find(o => o.agentId === a.id);
          const currentModel = override ? override.modelId : a.defaultModel;

          return (
            <div
              key={a.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">{a.name}</h3>
                  {override && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      Custom Override
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {a.id}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={currentModel}
                  onChange={e => onAddAgentOverride(a.id, e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {models.map((m, idx) => (
                    <option key={`${m.provider}-${m.id}-${idx}`} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
                {override && (
                  <button
                    onClick={() => onRemoveAgentOverride(a.id)}
                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-400 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
