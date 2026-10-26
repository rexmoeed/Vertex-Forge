import React from 'react';
import { ModelInfo, RoleModelAssignments } from '../../../types/aiProviders';

export interface DefaultsTabProps {
  defaults: RoleModelAssignments;
  onUpdateDefaults: (role: keyof RoleModelAssignments, modelId: string) => void;
  models: ModelInfo[];
}

export const DefaultsTab: React.FC<DefaultsTabProps> = ({
  defaults,
  onUpdateDefaults,
  models,
}) => {
  const roles: Array<{ key: keyof RoleModelAssignments; title: string; desc: string }> = [
    { key: 'orchestrator', title: 'Main Orchestrator', desc: 'Primary AI coordinating multi-step planning and tool dispatch' },
    { key: 'codeWriter', title: 'Code Writer', desc: 'Synthesizes modules, full-file updates, and fast implementations' },
    { key: 'architect', title: 'System Architect', desc: 'Performs deep dependency analysis and high-level scaffolding' },
    { key: 'debugger', title: 'Debugger & Diagnostics', desc: 'Inspects AST, stack traces, and compiles automated regression fixes' },
    { key: 'reviewer', title: 'Security & Quality Reviewer', desc: 'Audits secrets, OWASP compliance, and code cleanliness' },
  ];

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Default Model Assignments</h2>
        <p className="text-xs text-slate-400">
          Configure specialized foundation models per engineering discipline.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {roles.map(r => (
          <div
            key={r.key}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-xs font-bold text-white">{r.title}</h3>
              <p className="text-[11px] text-slate-400">{r.desc}</p>
            </div>

            <select
              value={defaults[r.key]}
              onChange={e => onUpdateDefaults(r.key, e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              {models.map((m, idx) => (
                <option key={`${m.provider}-${m.id}-${idx}`} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
