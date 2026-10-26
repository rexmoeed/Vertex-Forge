import React from 'react';
import { ProviderConfig, ProviderId, RoleModelAssignments } from '../../../types/aiProvider';

export interface DefaultsTabProps {
  roleAssignments: RoleModelAssignments;
  providers: ProviderConfig[];
  onRoleModelChange: (role: keyof RoleModelAssignments, providerId: ProviderId, modelId: string) => void;
}

export const DefaultsTab: React.FC<DefaultsTabProps> = ({
  roleAssignments,
  providers,
  onRoleModelChange,
}) => {
  const roles: Array<{ key: keyof RoleModelAssignments; label: string; desc: string }> = [
    { key: 'defaultChat', label: 'Default Chat Assistant', desc: 'Used for general Q&A and prompt answers' },
    { key: 'orchestrator', label: 'Main Orchestrator', desc: 'Plans autonomous task roadmaps and delegates' },
    { key: 'coding', label: 'Coding Model', desc: 'Code generation, refactoring, and file modifications' },
    { key: 'architecture', label: 'Architecture Model', desc: 'High-level system design and project planning' },
    { key: 'frontend', label: 'Frontend Engineering', desc: 'UI components, Tailwind CSS styling, React hooks' },
    { key: 'backend', label: 'Backend Engineering', desc: 'API endpoints, database queries, and server routes' },
    { key: 'codeReview', label: 'Code Review & Audit', desc: 'Evaluates diffs and reports code quality scores' },
    { key: 'testing', label: 'Testing & QA', desc: 'Generates unit tests, mocks, and regression suites' },
    { key: 'debugging', label: 'Debugging & Self-Heal', desc: 'Parses error stack traces and crafts code patches' },
    { key: 'fastLowCost', label: 'Fast / Low-Cost Model', desc: 'Quick checks, lint verification, and diagnostics' },
  ];

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Default Model Assignments</h2>
        <p className="text-xs text-slate-400">
          Select which model handles each software engineering role across the IDE.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(r => {
          const current = roleAssignments[r.key] || { providerId: 'gemini', modelId: 'gemini-3.8-flash' };
          return (
            <div key={r.key} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{r.label}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                  {current.providerId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{r.desc}</p>

              <select
                value={`${current.providerId}:${current.modelId}`}
                onChange={e => {
                  const [pId, mId] = e.target.value.split(':');
                  onRoleModelChange(r.key, pId as ProviderId, mId);
                }}
                className="mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                {providers
                  .flatMap(p => p.models.map(m => ({ providerId: p.id, modelId: m.id, name: `${p.name}: ${m.name}` })))
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
  );
};
