import React from 'react';
import { Sparkles, Bot } from 'lucide-react';
import { ProviderConfig, ProviderId, RoleModelAssignments, AgentModelOverride } from '../../../types/aiProvider';

export interface AgentOverridesTabProps {
  roleAssignments: RoleModelAssignments;
  agentOverrides: Record<string, AgentModelOverride>;
  providers: ProviderConfig[];
  onAgentOverrideChange: (agentRole: string, providerId: ProviderId, modelId: string) => void;
}

export const AgentOverridesTab: React.FC<AgentOverridesTabProps> = ({
  roleAssignments,
  agentOverrides,
  providers,
  onAgentOverrideChange,
}) => {
  const agents = [
    { role: 'Architect', desc: 'System design, templates, directory hierarchies' },
    { role: 'Frontend', desc: 'React components, UI styling, user experiences' },
    { role: 'Backend', desc: 'REST/GraphQL endpoints, database schemas, API mocks' },
    { role: 'Product Designer', desc: 'Design system tokens, color palettes, responsive layouts' },
    { role: 'QA Lead', desc: 'Acceptance testing, unit assertions, coverage analysis' },
    { role: 'Security Lead', desc: 'Dependency auditing, secret leakage checks, RBAC' },
  ];

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Hierarchical Agent Model Matrix</h2>
        <p className="text-xs text-slate-400">
          Inspect and override which model is used by the Main Orchestrator, Specialist Leads, and Sub-Agents.
        </p>
      </div>

      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
        {/* Orchestrator */}
        <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">MAIN ORCHESTRATOR</h4>
              <p className="text-[10px] text-slate-400">Root coordinator across specialist leads</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {roleAssignments.orchestrator.modelId} ({roleAssignments.orchestrator.providerId})
          </span>
        </div>

        {/* Specialist Leads */}
        <div className="pl-6 border-l-2 border-indigo-500/30 flex flex-col gap-3">
          {agents.map(agent => {
            const current = agentOverrides[agent.role] || {
              providerId: 'gemini',
              modelId: 'gemini-3.8-flash',
            };

            return (
              <div
                key={agent.role}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">{agent.role} Lead</h5>
                    <p className="text-[10px] text-slate-400">{agent.desc}</p>
                  </div>
                </div>

                <select
                  value={`${current.providerId}:${current.modelId}`}
                  onChange={e => {
                    const [pId, mId] = e.target.value.split(':');
                    onAgentOverrideChange(agent.role, pId as ProviderId, mId);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-mono"
                >
                  {providers
                    .flatMap(p => p.models.map(m => ({ providerId: p.id, modelId: m.id, name: `${p.name}: ${m.id}` })))
                    .map(opt => (
                      <option key={`${opt.providerId}:${opt.modelId}`} value={`${opt.providerId}:${opt.modelId}`}>
                        {opt.name}
                      </option>
                    ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
