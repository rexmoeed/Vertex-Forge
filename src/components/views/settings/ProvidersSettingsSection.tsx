import React from 'react';
import { ExternalLink } from 'lucide-react';

interface ProvidersSettingsSectionProps {
  onOpenProvidersHub: () => void;
}

export const ProvidersSettingsSection: React.FC<ProvidersSettingsSectionProps> = ({
  onOpenProvidersHub,
}) => {
  return (
    <div className="flex flex-col gap-5 text-xs">
      <div
        style={{ borderColor: 'var(--ide-border)' }}
        className="border-b pb-3 flex items-center justify-between"
      >
        <div>
          <h3 className="text-sm font-bold text-white">AI Provider Hub — Bring Your Own Keys (BYOK)</h3>
          <p className="text-[11px] text-slate-400">
            Connect personal API keys for Anthropic Claude, OpenAI, Gemini, local models & custom endpoints.
          </p>
        </div>
        <button
          onClick={onOpenProvidersHub}
          style={{ backgroundColor: 'var(--ide-accent)' }}
          className="px-3.5 py-1.5 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer hover:opacity-90"
        >
          <span>Open Dedicated Hub</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
        className="p-4 border rounded-xl flex flex-col gap-3"
      >
        <span className="font-semibold text-slate-200">Supported LLM Services</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h4 className="font-bold text-white truncate">Google Gemini</h4>
              <p className="text-[10px] text-slate-400 truncate">Gemini 3.8 Flash, 2.5 Pro</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 ml-2">Active</span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h4 className="font-bold text-white truncate">Google Jules</h4>
              <p className="text-[10px] text-slate-400 truncate">Autonomous Cloud PR Agent</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 ml-2">Connected</span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h4 className="font-bold text-white truncate">Anthropic Claude</h4>
              <p className="text-[10px] text-slate-400 truncate">Claude 3.7 & 3.5 Sonnet</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0 ml-2">BYOK Ready</span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h4 className="font-bold text-white truncate">OpenAI</h4>
              <p className="text-[10px] text-slate-400 truncate">GPT-4o, GPT-4o Mini, o3</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0 ml-2">BYOK Ready</span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h4 className="font-bold text-white truncate">Local / Custom Endpoint</h4>
              <p className="text-[10px] text-slate-400 truncate">Ollama, LM Studio, Groq</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0 ml-2">BYOK Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
