import React from 'react';
import type { useOperatorConsole } from '../../../hooks/useOperatorConsole';

interface Props {
  rules: ReturnType<typeof useOperatorConsole>['rules'];
  violations: ReturnType<typeof useOperatorConsole>['violations'];
  onToggleRule: (id: string, enabled: boolean) => void;
}

export const OperatorRulebookTab: React.FC<Props> = ({ rules, violations, onToggleRule }) => {
  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-white">Rulebook Hard Gates</h2>
        <p className="text-xs text-slate-400">
          Pre-execution checks run strictly in the backend. Blocks cannot be overridden by AI; only owner overrides are permitted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 ${
              rule.enabled ? 'bg-slate-900 border-slate-800' : 'bg-slate-900/40 border-slate-850 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{rule.description}</span>
              <span
                className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                  rule.severity === 'block' ? 'bg-rose-500/20 text-rose-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {rule.severity}
              </span>
            </div>

            {rule.pattern && (
              <code className="text-[10px] font-mono text-cyan-300 bg-black/40 p-1.5 rounded border border-white/5 truncate">
                {rule.pattern}
              </code>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-400">Scope: {rule.scope.join(', ')}</span>
              <button
                onClick={() => onToggleRule(rule.id, !rule.enabled)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                {rule.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Violations */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <h3 className="text-xs font-bold text-white mb-2">Recent Gate Violations</h3>
        <div className="space-y-1.5">
          {violations.map(v => (
            <div key={v.id} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-300">[{v.severity.toUpperCase()}]</span> {v.ruleDescription} on{' '}
                <code className="text-white">{v.target}</code>
              </div>
              <span className="text-slate-400 text-[10px]">{new Date(v.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
