import React, { useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { Columns, ChevronDown } from 'lucide-react';
import { LayoutPreset } from '../../../types/layout';

export const ToolbarPresetsDropdown: React.FC = () => {
  const layout = useLayout();
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);

  const presets: Array<{ id: LayoutPreset; label: string; desc: string }> = [
    { id: 'default', label: 'Default', desc: 'Standard workspace with Explorer, Editor & AI' },
    { id: 'minimal', label: 'Minimal', desc: 'Editor-only distraction-free focus' },
    { id: 'developer', label: 'Developer', desc: 'Explorer, Editor and tall Terminal dock' },
    { id: 'ai', label: 'AI Orchestrator', desc: 'Explorer, Editor, AI Assistant & Terminal' },
    { id: 'debug', label: 'Debugging', desc: 'Expanded diagnostics, problems panel & tests' },
    { id: 'zen', label: 'Zen Mode', desc: 'Maximize code editor and hide all surrounding panels' },
    { id: 'design', label: 'Design Studio', desc: 'Editor and live responsive preview side-by-side' },
    { id: 'fullstack', label: 'Full-Stack', desc: 'Dual editor with tall terminal dock for backend logs' },
  ];

  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 text-xs font-medium transition-colors cursor-pointer"
        title="Select Workspace Layout Preset"
      >
        <Columns className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="capitalize font-medium">{layout.config.currentPreset}</span>
        <ChevronDown className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
      </button>

      {isPresetDropdownOpen && (
        <div
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text)',
          }}
          className="absolute top-full right-0 mt-1 w-64 backdrop-blur-xl border rounded-xl shadow-2xl py-1 z-50"
        >
          <div
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--ide-text-muted)' }}
          >
            Layout Presets
          </div>
          {presets.map(pr => (
            <button
              key={pr.id}
              onClick={() => {
                layout.applyPreset(pr.id);
                setIsPresetDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors cursor-pointer ${
                layout.config.currentPreset === pr.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-semibold">{pr.label}</span>
              <span className="text-[10px] text-slate-400">{pr.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
