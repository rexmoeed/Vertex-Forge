import React from 'react';

interface AiEngineSettingsSectionProps {
  activeModel: string;
  setActiveModel: (model: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
}

export const AiEngineSettingsSection: React.FC<AiEngineSettingsSectionProps> = ({
  activeModel,
  setActiveModel,
  temperature,
  setTemperature,
}) => {
  return (
    <div className="flex flex-col gap-5 text-xs">
      <div style={{ borderColor: 'var(--ide-border)' }} className="border-b pb-3">
        <h3 className="text-sm font-bold text-white">AI Engine & Model Configuration</h3>
        <p className="text-[11px] text-slate-400">Select model, sampling temperature, and agent autonomy limits.</p>
      </div>

      <div className="flex flex-col gap-2 max-w-sm">
        <label className="font-semibold text-slate-300">Active Model</label>
        <select
          value={activeModel}
          onChange={e => setActiveModel(e.target.value)}
          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs cursor-pointer"
        >
          <option value="gemini-3.8-flash">gemini-3.8-flash (Ultra fast, recommended)</option>
          <option value="gemini-2.5-pro">gemini-2.5-pro (Deep reasoning & code analysis)</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 max-w-xs">
        <label className="font-semibold text-slate-300">Sampling Temperature: {temperature}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={temperature}
          onChange={e => setTemperature(Number(e.target.value))}
          className="accent-indigo-500 cursor-pointer"
        />
        <span className="text-[10px] text-slate-400">Lower values yield more deterministic code generation.</span>
      </div>
    </div>
  );
};
