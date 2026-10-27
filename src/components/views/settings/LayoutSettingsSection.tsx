import React from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { RotateCcw, Check } from 'lucide-react';

interface LayoutSettingsSectionProps {
  onResetLayout: () => void;
}

export const LayoutSettingsSection: React.FC<LayoutSettingsSectionProps> = ({
  onResetLayout,
}) => {
  const layout = useLayout();

  return (
    <div className="flex flex-col gap-6 text-xs">
      <div
        style={{ borderColor: 'var(--ide-border)' }}
        className="border-b pb-3 flex items-center justify-between"
      >
        <div>
          <h3 className="text-sm font-bold text-white">Layout & Panel Management</h3>
          <p className="text-[11px] text-slate-400">
            Control panel visibility, default dock sizes, editor splits, and responsive breakpoints.
          </p>
        </div>
        <button
          onClick={onResetLayout}
          className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Layout</span>
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-2.5">
        <label className="font-semibold text-slate-200 text-xs">Layout Presets</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { id: 'default', title: 'Default', desc: 'Explorer + Editor + AI Assistant' },
            { id: 'minimal', title: 'Minimal', desc: 'Editor-only distraction-free focus' },
            { id: 'developer', title: 'Developer', desc: 'Explorer + Editor + Tall Terminal' },
            { id: 'ai', title: 'AI Orchestrator', desc: 'Explorer + Editor + AI + Terminal' },
            { id: 'debug', title: 'Debugging', desc: 'Diagnostics, Problems, and Test Dock' },
            { id: 'zen', title: 'Zen Mode', desc: 'Full screen clean code editor' },
          ].map(pr => {
            const isSelected = layout.config.currentPreset === pr.id;
            return (
              <button
                key={pr.id}
                onClick={() => layout.applyPreset(pr.id as any)}
                style={{
                  borderColor: isSelected ? 'var(--ide-accent)' : 'var(--ide-border)',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--ide-surface-elevated)',
                }}
                className="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer hover:border-indigo-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{pr.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="text-[10px] text-slate-400">{pr.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel Dimensions & Toggles */}
      <div className="flex flex-col gap-3">
        <label className="font-semibold text-slate-200 text-xs">Panel Dimensions & Safe Limits</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Primary Sidebar */}
          <div
            style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
            className="p-3.5 rounded-xl border flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Primary Sidebar</span>
              <button
                onClick={layout.togglePrimarySidebar}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  layout.config.primarySidebarVisible
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {layout.config.primarySidebarVisible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Width: {layout.config.primarySidebarWidth}px (Min: 180px, Max: 550px)
            </span>
            <input
              type="range"
              min="180"
              max="550"
              value={layout.config.primarySidebarWidth}
              onChange={e => layout.setPrimarySidebarWidth(Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>

          {/* Secondary AI Sidebar */}
          <div
            style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
            className="p-3.5 rounded-xl border flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">AI Assistant Panel</span>
              <button
                onClick={layout.toggleSecondarySidebar}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  layout.config.secondarySidebarVisible
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {layout.config.secondarySidebarVisible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Width: {layout.config.secondarySidebarWidth}px (Min: 280px, Max: 650px)
            </span>
            <input
              type="range"
              min="280"
              max="650"
              value={layout.config.secondarySidebarWidth}
              onChange={e => layout.setSecondarySidebarWidth(Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>

          {/* Bottom Panel */}
          <div
            style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
            className="p-3.5 rounded-xl border flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Terminal Bottom Dock</span>
              <button
                onClick={layout.toggleBottomPanel}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  layout.config.bottomPanelVisible
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {layout.config.bottomPanelVisible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Height: {layout.config.bottomPanelHeight}px (Min: 120px, Max: 650px)
            </span>
            <input
              type="range"
              min="120"
              max="550"
              value={layout.config.bottomPanelHeight}
              onChange={e => layout.setBottomPanelHeight(Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
