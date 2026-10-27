import React from 'react';
import { AutonomyMode } from '../../../types/ide';

interface AgentsSettingsSectionProps {
  autonomyMode: AutonomyMode;
  setAutonomyMode: (mode: AutonomyMode) => void;
  maxConcurrentAgents: number;
  setMaxConcurrentAgents: (max: number) => void;
}

export const AgentsSettingsSection: React.FC<AgentsSettingsSectionProps> = ({
  autonomyMode,
  setAutonomyMode,
  maxConcurrentAgents,
  setMaxConcurrentAgents,
}) => {
  return (
    <div className="flex flex-col gap-5 text-xs">
      <div style={{ borderColor: 'var(--ide-border)' }} className="border-b pb-3">
        <h3 className="text-sm font-bold text-white">Autonomous Agent Team & Permissions</h3>
        <p className="text-[11px] text-slate-400">Configure supervised vs autonomous execution and concurrency.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold text-slate-300">Autonomy Mode</label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => setAutonomyMode('supervised')}
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
              autonomyMode === 'supervised'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-xs text-white">Supervised Mode</span>
            <span className="text-[10px] text-slate-400">Human reviews and approves each code edit step.</span>
          </button>

          <button
            onClick={() => setAutonomyMode('autonomous')}
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
              autonomyMode === 'autonomous'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-xs text-white">Autonomous Mode</span>
            <span className="text-[10px] text-slate-400">Agent writes, tests, and self-corrects until verified.</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-xs">
        <label className="font-semibold text-slate-300">Max Concurrent Sub-Agents: {maxConcurrentAgents}</label>
        <input
          type="range"
          min="1"
          max="8"
          value={maxConcurrentAgents}
          onChange={e => setMaxConcurrentAgents(Number(e.target.value))}
          className="accent-indigo-500 cursor-pointer"
        />
      </div>
    </div>
  );
};
