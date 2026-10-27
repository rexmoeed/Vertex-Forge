import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import {
  RotateCcw,
  Check,
  Laptop,
  Moon,
  Sun,
  Contrast,
} from 'lucide-react';
import { THEME_REGISTRY } from '../../../services/themeRegistry';
import { ThemeMode, DensityMode } from '../../../types/theme';

interface AppearanceSettingsSectionProps {
  onResetAppearance: () => void;
}

export const AppearanceSettingsSection: React.FC<AppearanceSettingsSectionProps> = ({
  onResetAppearance,
}) => {
  const themeEngine = useTheme();

  const accentColorPresets = [
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Sky Blue', color: '#0ea5e9' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Violet', color: '#8b5cf6' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Slate', color: '#94a3b8' },
  ];

  const presetsList = [
    'one-dark',
    'dracula',
    'nord',
    'monokai',
    'solarized-dark',
    'solarized-light',
    'github-dark',
    'github-light',
    'midnight',
    'abyss',
  ];

  return (
    <div className="flex flex-col gap-6 text-xs">
      <div
        style={{ borderColor: 'var(--ide-border)' }}
        className="border-b pb-3 flex items-center justify-between"
      >
        <div>
          <h3 className="text-sm font-bold text-white">Appearance & Theme Engine</h3>
          <p className="text-[11px] text-slate-400">
            Switch color modes, choose professional themes, customize accents, and configure accessibility.
          </p>
        </div>
        <button
          onClick={onResetAppearance}
          className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Appearance</span>
        </button>
      </div>

      {/* Theme Mode Selector */}
      <div className="flex flex-col gap-2.5">
        <label className="font-semibold text-slate-200 text-xs">Theme Mode</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {[
            { id: 'system', label: 'System', icon: Laptop, desc: 'Auto follow OS' },
            { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep dark IDE' },
            { id: 'light', label: 'Light', icon: Sun, desc: 'Pristine light' },
            { id: 'high-contrast-dark', label: 'HC Dark', icon: Contrast, desc: 'High contrast AAA' },
            { id: 'high-contrast-light', label: 'HC Light', icon: Contrast, desc: 'High contrast light' },
          ].map(m => {
            const isSelected = themeEngine.themeMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => themeEngine.setThemeMode(m.id as ThemeMode)}
                style={{
                  borderColor: isSelected ? 'var(--ide-accent)' : 'var(--ide-border)',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--ide-surface-elevated)',
                }}
                className="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer hover:border-indigo-400 group"
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="font-bold text-slate-100 text-xs">{m.label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Professional Theme Presets */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-200 text-xs">Professional IDE Presets</label>
          <span className="text-[11px] text-slate-400">
            Active: <strong className="text-indigo-400">{themeEngine.activeTheme.name}</strong>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {presetsList.map(presetId => {
            const def = THEME_REGISTRY[presetId];
            if (!def) return null;
            const isSelected = themeEngine.themeId === presetId && themeEngine.themeMode !== 'system';
            return (
              <button
                key={presetId}
                onClick={() => themeEngine.setTheme(presetId)}
                style={{
                  borderColor: isSelected ? 'var(--ide-accent)' : 'var(--ide-border)',
                  backgroundColor: 'var(--ide-surface-elevated)',
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer hover:border-indigo-400 ${
                  isSelected ? 'ring-2 ring-indigo-500/50 shadow-md' : ''
                }`}
              >
                <div
                  style={{ backgroundColor: def.colors.bg }}
                  className="h-10 rounded-lg p-1.5 flex flex-col justify-between border border-white/10 shadow-inner overflow-hidden"
                >
                  <div className="flex items-center gap-1">
                    <div style={{ backgroundColor: def.colors.accent }} className="w-2.5 h-2.5 rounded-full" />
                    <div style={{ backgroundColor: def.colors.editorBg }} className="w-2.5 h-2.5 rounded-full border border-white/20" />
                    <div style={{ backgroundColor: def.colors.textMuted }} className="w-2.5 h-2.5 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono px-0.5">
                    <span style={{ color: def.colors.text }}>Aa</span>
                    <span style={{ color: def.colors.accent }}>{def.category}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate">{def.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{def.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Accent Color */}
      <div className="flex flex-col gap-2.5">
        <label className="font-semibold text-slate-200 text-xs">Custom Accent Color</label>
        <div className="flex items-center gap-3 flex-wrap">
          {accentColorPresets.map(ac => {
            const isSelected = themeEngine.accentColor.toLowerCase() === ac.color.toLowerCase();
            return (
              <button
                key={ac.name}
                onClick={() => themeEngine.setAccentColor(ac.color)}
                style={{ backgroundColor: ac.color }}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center shadow-md ${
                  isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                }`}
                title={`${ac.name} (${ac.color})`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <input
              type="color"
              value={themeEngine.accentColor}
              onChange={e => themeEngine.setAccentColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
              title="Custom Color Picker"
            />
            <span className="font-mono text-[11px] text-slate-400 uppercase">
              {themeEngine.accentColor}
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Density */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-slate-200 text-xs">Workspace Density</label>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map(d => {
            const isSelected = themeEngine.density === d;
            return (
              <button
                key={d}
                onClick={() => themeEngine.setDensity(d)}
                style={{
                  borderColor: isSelected ? 'var(--ide-accent)' : 'var(--ide-border)',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--ide-surface-elevated)',
                }}
                className="px-3 py-2 rounded-xl border text-xs capitalize cursor-pointer flex items-center justify-between"
              >
                <span className="font-medium text-slate-200">{d}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessibility Settings */}
      <div
        style={{ borderColor: 'var(--ide-border)' }}
        className="border-t pt-4 flex flex-col gap-3"
      >
        <h4 className="font-bold text-slate-200 text-xs">Accessibility & Motion</h4>
        <label className="flex items-center gap-3 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={themeEngine.reducedMotion}
            onChange={e => themeEngine.setReducedMotion(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
          />
          <div>
            <span className="font-bold block">Reduce Motion & Transitions</span>
            <span className="text-[10px] text-slate-400">
              Disables unnecessary sliding animations and reduces panel transition durations.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};
