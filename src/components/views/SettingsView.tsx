import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Settings,
  Palette,
  Bot,
  Shield,
  Terminal,
  FileCode,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Key,
  ExternalLink,
  Sun,
  Moon,
  Laptop,
  Contrast,
  Layout,
  RefreshCw,
  Save,
  Clock,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { THEME_REGISTRY } from '../../services/themeRegistry';
import { ThemeMode, DensityMode } from '../../types/theme';

export const SettingsView: React.FC = () => {
  const {
    autonomyMode,
    setAutonomyMode,
    setActiveView,
    autoSave,
    setAutoSave,
    autoSaveDelay,
    setAutoSaveDelay,
    saveCurrentFile,
    saveAllFiles,
    isAutoSaving,
  } = useIDE() as any;
  const layout = useLayout();
  const themeEngine = useTheme();

  const [activeSection, setActiveSection] = useState<
    'appearance' | 'layout' | 'editor' | 'providers' | 'ai' | 'agents' | 'terminal' | 'security'
  >('appearance');

  // Local settings state
  const [fontSize, setFontSize] = useState<number>(13);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxConcurrentAgents, setMaxConcurrentAgents] = useState<number>(4);
  const [terminalTimeout, setTerminalTimeout] = useState<number>(30);
  const [protectEnvFiles, setProtectEnvFiles] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetLayout = () => {
    layout.resetLayout();
    setResetNotice('Layout restored to default');
    setTimeout(() => setResetNotice(null), 2500);
  };

  const handleResetAppearance = () => {
    themeEngine.resetAppearance();
    setResetNotice('Appearance restored to default');
    setTimeout(() => setResetNotice(null), 2500);
  };

  const sections = [
    { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
    { id: 'layout', label: 'Layout & Panels', icon: Layout },
    { id: 'editor', label: 'Editor & Auto-Save', icon: FileCode },
    { id: 'providers', label: 'AI Providers (BYOK)', icon: Key },
    { id: 'ai', label: 'AI Model & Engine', icon: Bot },
    { id: 'agents', label: 'Agent Team & Permissions', icon: Sliders },
    { id: 'terminal', label: 'Terminal & Execution', icon: Terminal },
    { id: 'security', label: 'Privacy & Security Boundary', icon: Shield },
  ];

  const accentColorPresets = [
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Teal', color: '#14b8a6' },
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
    <div
      style={{ backgroundColor: 'var(--ide-bg)', color: 'var(--ide-text)' }}
      className="flex-1 w-full h-full min-h-0 overflow-y-auto p-6 flex flex-col gap-6 select-none"
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--ide-surface)',
          borderColor: 'var(--ide-border)',
        }}
        className="border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              backgroundColor: 'var(--ide-surface-elevated)',
              borderColor: 'var(--ide-border)',
              color: 'var(--ide-accent)',
            }}
            className="w-10 h-10 rounded-xl border flex items-center justify-center shadow shrink-0"
          >
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Vertex Forge Studio Settings</h2>
            <p className="text-xs text-slate-400">
              Configure appearance, professional themes, panel layout stability, model parameters, and security rules.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {resetNotice && (
            <span className="text-xs text-emerald-400 font-medium px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 animate-fadeIn">
              {resetNotice}
            </span>
          )}

          {/* Global Auto-Save Header Toggle */}
          <button
            type="button"
            onClick={() => setAutoSave(!autoSave)}
            style={{
              backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.12)' : 'var(--ide-surface-elevated)',
              borderColor: autoSave ? 'rgba(16, 185, 129, 0.4)' : 'var(--ide-border)',
            }}
            className="border px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-all hover:border-slate-500"
            title="Toggle Global Auto-Save (triggers on file changes and focus loss)"
          >
            <div className={`w-2 h-2 rounded-full ${autoSave ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-200 font-semibold">Auto-Save:</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              autoSave ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {autoSave ? 'ENABLED' : 'DISABLED'}
            </span>
          </button>

          <button
            onClick={handleSave}
            style={{
              backgroundColor: 'var(--ide-accent)',
              color: '#ffffff',
            }}
            className="px-4 py-2 hover:opacity-90 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved' : 'Save Preferences'}</span>
          </button>

          <button
            onClick={() => setActiveView('editor')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Return to Main Editor Workspace"
          >
            <span>←</span> Back to Editor
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Navigation Sidebar */}
        <div
          style={{
            backgroundColor: 'var(--ide-surface)',
            borderColor: 'var(--ide-border)',
          }}
          className="border rounded-xl p-2 flex flex-col gap-1 h-fit"
        >
          {sections.map(s => {
            const Icon = s.icon;
            const isSelected = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id as any)}
                style={{
                  backgroundColor: isSelected ? 'var(--ide-accent)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--ide-text-muted)',
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer hover:text-white"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{s.label}</span>
              </button>
            );
          })}

          <div
            style={{ borderColor: 'var(--ide-border)' }}
            className="border-t my-2 pt-2 flex flex-col gap-1"
          >
            <button
              onClick={handleResetAppearance}
              className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 flex items-center gap-2"
              title="Reset theme and colors to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Appearance</span>
            </button>
            <button
              onClick={handleResetLayout}
              className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 flex items-center gap-2"
              title="Reset panels and splitters to default"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>

        {/* Setting Panels */}
        <div
          style={{
            backgroundColor: 'var(--ide-surface)',
            borderColor: 'var(--ide-border)',
          }}
          className="lg:col-span-3 border rounded-xl p-6 flex flex-col gap-6"
        >
          {/* 1. APPEARANCE & THEMES */}
          {activeSection === 'appearance' && (
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
                  onClick={handleResetAppearance}
                  className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Appearance</span>
                </button>
              </div>

              {/* Theme Mode Selector (System, Light, Dark, High Contrast) */}
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
                        {/* Theme Palette Swatch Preview */}
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
          )}

          {/* 2. LAYOUT & PANELS */}
          {activeSection === 'layout' && (
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
                  onClick={handleResetLayout}
                  className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] flex items-center gap-1.5"
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
          )}

          {/* 3. EDITOR & AUTO-SAVE */}
          {activeSection === 'editor' && (
            <div className="flex flex-col gap-6 text-xs">
              <div
                style={{ borderColor: 'var(--ide-border)' }}
                className="border-b pb-3 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">Editor & Auto-Save Configuration</h3>
                  <p className="text-[11px] text-slate-400">
                    Control automatic file saving triggers, debounce thresholds, focus-loss persistence, and editor behavior.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveAllFiles()}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Save All Files</span>
                  </button>
                </div>
              </div>

              {/* 1. HERO GLOBAL AUTO-SAVE TOGGLE CARD */}
              <div
                style={{
                  backgroundColor: 'var(--ide-surface-elevated)',
                  borderColor: autoSave ? 'rgba(16, 185, 129, 0.4)' : 'var(--ide-border)',
                }}
                className="p-5 rounded-2xl border flex flex-col gap-4 shadow-lg transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      style={{
                        backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        borderColor: autoSave ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.3)',
                      }}
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                    >
                      <Zap className={`w-5 h-5 ${autoSave ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-bold text-white">Global Auto-Save</h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            autoSave
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {autoSave ? 'ACTIVE • ON FILE CHANGE & FOCUS LOSS' : 'DISABLED • MANUAL SAVE (Cmd+S)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        When enabled, modified files are automatically saved to disk when file content changes or immediately when the editor loses focus (switching panels, tabs, or external applications).
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={e => setAutoSave(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                  </label>
                </div>

                {/* Two Triggers Detail Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Trigger 1: File Change */}
                  <div
                    style={{
                      backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.4)',
                      borderColor: autoSave ? 'rgba(16, 185, 129, 0.25)' : 'var(--ide-border)',
                    }}
                    className="p-3.5 rounded-xl border flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className={`w-4 h-4 ${autoSave ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="font-bold text-white text-xs">Trigger 1: On File Change</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        autoSave ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        Debounced ({autoSaveDelay}ms)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      As you type, changes are staged in the virtual workspace and committed to disk automatically {autoSaveDelay}ms after typing pauses, avoiding excessive I/O while guaranteeing safety.
                    </p>
                  </div>

                  {/* Trigger 2: Focus Loss */}
                  <div
                    style={{
                      backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.4)',
                      borderColor: autoSave ? 'rgba(16, 185, 129, 0.25)' : 'var(--ide-border)',
                    }}
                    className="p-3.5 rounded-xl border flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${autoSave ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="font-bold text-white text-xs">Trigger 2: On Focus Loss</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        autoSave ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        Instant Flush (0ms)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Immediately commits unsaved edits the instant you click away from the code editor (e.g., clicking the terminal, explorer, AI assistant, changing tabs, or blurring the browser window).
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. AUTO-SAVE DEBOUNCE DELAY SETTINGS */}
              <div
                style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
                className="p-4 rounded-xl border flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200">Auto-Save Delay (File Change Debounce)</h4>
                    <p className="text-[10px] text-slate-400">
                      Duration in milliseconds to wait after your last keystroke before saving file to disk.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                    {autoSaveDelay} ms
                  </span>
                </div>

                {/* Preset Delay Buttons */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { ms: 500, label: '500ms', desc: 'Fast' },
                    { ms: 1000, label: '1000ms', desc: 'Recommended' },
                    { ms: 2000, label: '2000ms', desc: 'Relaxed' },
                    { ms: 3000, label: '3000ms', desc: 'Deferred' },
                  ].map(opt => {
                    const isSelected = autoSaveDelay === opt.ms;
                    return (
                      <button
                        key={opt.ms}
                        onClick={() => setAutoSaveDelay(opt.ms)}
                        style={{
                          borderColor: isSelected ? 'var(--ide-accent)' : 'var(--ide-border)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                        }}
                        className="p-2.5 rounded-lg border text-left flex flex-col gap-0.5 cursor-pointer transition-colors hover:border-slate-500"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={autoSaveDelay}
                  onChange={e => setAutoSaveDelay(Number(e.target.value))}
                  className="accent-indigo-500 mt-1"
                />
              </div>

              {/* 3. WORKSPACE PERSISTENCE VERIFICATION & ACTIONS */}
              <div
                style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
                className="p-4 rounded-xl border flex flex-col gap-3"
              >
                <h4 className="font-bold text-slate-200">Manual Save & Workspace Persistence</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => saveCurrentFile()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Active File</span>
                  </button>
                  <button
                    onClick={() => saveAllFiles()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save All Workspace Files</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-[11px] flex items-center justify-between">
                  <span>Auto-Save state is remembered across reloads via browser local storage.</span>
                  <span className="text-emerald-400 font-mono text-[10px]">vertexforge_autosave: {String(autoSave)}</span>
                </div>
              </div>

              {/* 4. EDITOR TYPOGRAPHY & BEHAVIOR */}
              <div
                style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
                className="p-4 rounded-xl border flex flex-col gap-3"
              >
                <h4 className="font-bold text-slate-200">Editor Typography & Gutter</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-semibold">Editor Font Size: {fontSize}px</label>
                    <input
                      type="range"
                      min="11"
                      max="18"
                      value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      className="accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500">Default: 13px monospaced font</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-semibold">Tab Spacing</label>
                    <div className="flex gap-2">
                      {[2, 4].map(spaces => (
                        <button
                          key={spaces}
                          style={{
                            backgroundColor: spaces === 2 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                            borderColor: spaces === 2 ? 'var(--ide-accent)' : 'var(--ide-border)',
                          }}
                          className="px-3 py-1.5 rounded-lg border text-xs font-mono text-slate-200 cursor-pointer"
                        >
                          {spaces} Spaces
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. AI PROVIDERS (BYOK) */}
          {activeSection === 'providers' && (
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
                  onClick={() => setActiveView('providers')}
                  style={{ backgroundColor: 'var(--ide-accent)' }}
                  className="px-3.5 py-1.5 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
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
          )}

          {/* 4. AI MODEL & ENGINE */}
          {activeSection === 'ai' && (
            <div className="flex flex-col gap-5 text-xs">
              <div
                style={{ borderColor: 'var(--ide-border)' }}
                className="border-b pb-3"
              >
                <h3 className="text-sm font-bold text-white">AI Engine & Model Configuration</h3>
                <p className="text-[11px] text-slate-400">Select model, sampling temperature, and agent autonomy limits.</p>
              </div>

              <div className="flex flex-col gap-2 max-w-sm">
                <label className="font-semibold text-slate-300">Active Model</label>
                <select
                  value={activeModel}
                  onChange={e => setActiveModel(e.target.value)}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
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
                  className="accent-indigo-500"
                />
                <span className="text-[10px] text-slate-400">Lower values yield more deterministic code generation.</span>
              </div>
            </div>
          )}

          {/* 5. AGENTS & PERMISSIONS */}
          {activeSection === 'agents' && (
            <div className="flex flex-col gap-5 text-xs">
              <div
                style={{ borderColor: 'var(--ide-border)' }}
                className="border-b pb-3"
              >
                <h3 className="text-sm font-bold text-white">Autonomous Agent Team & Permissions</h3>
                <p className="text-[11px] text-slate-400">Configure supervised vs autonomous execution and concurrency.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-slate-300">Autonomy Mode</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => setAutonomyMode('supervised')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 ${
                      autonomyMode === 'supervised'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-xs text-white">Supervised Mode</span>
                    <span className="text-[10px] text-slate-400">Human reviews and approves each code edit step.</span>
                  </button>

                  <button
                    onClick={() => setAutonomyMode('autonomous')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 ${
                      autonomyMode === 'autonomous'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
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
                  className="accent-indigo-500"
                />
              </div>
            </div>
          )}

          {/* 6. TERMINAL & EXECUTION */}
          {activeSection === 'terminal' && (
            <div className="flex flex-col gap-5 text-xs">
              <div
                style={{ borderColor: 'var(--ide-border)' }}
                className="border-b pb-3"
              >
                <h3 className="text-sm font-bold text-white">Terminal & Command Execution</h3>
                <p className="text-[11px] text-slate-400">Manage process sandboxing and execution timeout budgets.</p>
              </div>

              <div className="flex flex-col gap-2 max-w-xs">
                <label className="font-semibold text-slate-300">Execution Timeout: {terminalTimeout} seconds</label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={terminalTimeout}
                  onChange={e => setTerminalTimeout(Number(e.target.value))}
                  className="accent-indigo-500"
                />
                <span className="text-[10px] text-slate-400">Commands exceeding this threshold will be safely cancelled.</span>
              </div>
            </div>
          )}

          {/* 7. SECURITY */}
          {activeSection === 'security' && (
            <div className="flex flex-col gap-5 text-xs">
              <div
                style={{ borderColor: 'var(--ide-border)' }}
                className="border-b pb-3"
              >
                <h3 className="text-sm font-bold text-white">Security & Workspace Isolation</h3>
                <p className="text-[11px] text-slate-400">Hardened desktop safeguards preventing path traversal and secret leakage.</p>
              </div>

              <label className="flex items-center gap-3 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectEnvFiles}
                  onChange={e => setProtectEnvFiles(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="font-bold block">Protect Sensitive Environment Files (.env, .git)</span>
                  <span className="text-[10px] text-slate-400">Blocks automated AI overwrites to secret credentials without explicit confirmation.</span>
                </div>
              </label>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex flex-col gap-1">
                <span className="font-bold">Electron Context Isolation: Active</span>
                <span className="text-[10px] text-slate-300 leading-snug">
                  Renderer process operates with zero direct Node.js access; all filesystem calls routed through typed preload IPC with workspace path boundary checks.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
