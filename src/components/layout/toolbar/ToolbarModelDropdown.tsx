import React, { useState } from 'react';
import { useIDE } from '../../../context/IDEContext';
import { Cpu, ChevronDown, Check, Key } from 'lucide-react';

export const ToolbarModelDropdown: React.FC = () => {
  const { setActiveView } = useIDE();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-3.8-flash');

  const models = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High)', desc: 'Next-Gen Multimodal Reasoning Engine', badge: 'Active' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Flagship Complex System Architecture', badge: 'Reasoning' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Sub-second Latency File Operations', badge: 'Fast' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', desc: 'Anthropic Hybrid Extended Thinking', badge: 'BYOK' },
    { id: 'gpt-4o', name: 'GPT-4o Omni', desc: 'OpenAI Multimodal Flagship', badge: 'BYOK' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Open Weights Deep Reasoning', badge: 'BYOK' },
  ];

  const currentModelObj = models.find(m => m.id === activeModel) || models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 hover:border-indigo-400 text-indigo-700 dark:bg-gradient-to-r dark:from-indigo-950/60 dark:to-purple-950/40 dark:border-indigo-500/30 dark:hover:border-indigo-400/60 dark:text-indigo-200 text-xs font-medium transition-all shadow-xs cursor-pointer group"
        title="Active Autonomous Reasoning Model"
      >
        <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors shrink-0" />
        <span className="truncate max-w-[70px] lg:max-w-[100px] xl:max-w-[130px] font-semibold">{currentModelObj.name}</span>
        <ChevronDown className="w-3 h-3 text-indigo-600 dark:text-indigo-300 shrink-0" />
      </button>

      {isModelDropdownOpen && (
        <div
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text)',
          }}
          className="absolute top-full right-0 mt-1 w-80 backdrop-blur-xl border rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn"
        >
          <div
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between"
            style={{ color: 'var(--ide-text-muted)' }}
          >
            <span>Select AI Model</span>
            <span className="font-mono" style={{ color: 'var(--ide-accent)' }}>Antigravity Core</span>
          </div>
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => {
                setActiveModel(m.id);
                setIsModelDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                activeModel === m.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-semibold truncate">{m.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{m.desc}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-indigo-600 border border-indigo-200 dark:bg-slate-800 dark:text-indigo-300 dark:border-indigo-500/30">
                  {m.badge}
                </span>
                {activeModel === m.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </button>
          ))}

          <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
          <button
            onClick={() => {
              setIsModelDropdownOpen(false);
              setActiveView('providers');
            }}
            className="w-full text-left px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configure Custom API Keys (BYOK)...</span>
          </button>
        </div>
      )}
    </div>
  );
};
