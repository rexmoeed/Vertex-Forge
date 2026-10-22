import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { useTheme } from '../../context/ThemeContext';
import { THEME_REGISTRY } from '../../services/themeRegistry';
import {
  Layers,
  ChevronDown,
  Search,
  Play,
  Sparkles,
  ExternalLink,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Maximize2,
  Minimize2,
  Columns,
  Wrench,
  Bot,
  Zap,
  Key,
  Mic,
  Cpu,
  Radio,
  Check,
  Palette,
} from 'lucide-react';
import { LayoutPreset } from '../../types/layout';
import { CursorMode } from '../../context/IDEContext';

interface TopToolbarProps {
  onOpenCommandPalette: () => void;
  onOpenNewProject: () => void;
  onOpenComposer?: () => void;
  onOpenCursorRules?: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onOpenCommandPalette,
  onOpenNewProject,
  onOpenComposer,
  onOpenCursorRules,
}) => {
  const {
    activeProject,
    projects,
    switchProject,
    cursorMode,
    setCursorMode,
    runTests,
    testResults,
    triggerSelfHealDebug,
    activeFile,
    setActiveView,
    setIsVoiceModalOpen,
    devServerProcess,
  } = useIDE();

  const layout = useLayout();
  const themeEngine = useTheme();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-3.8-flash');

  const failedTests = testResults.filter((t) => t.status === 'failed').length;

  const models = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High)', desc: 'Next-Gen Multimodal Reasoning Engine', badge: 'Active' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Flagship Complex System Architecture', badge: 'Reasoning' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Sub-second Latency File Operations', badge: 'Fast' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', desc: 'Anthropic Hybrid Extended Thinking', badge: 'BYOK' },
    { id: 'gpt-4o', name: 'GPT-4o Omni', desc: 'OpenAI Multimodal Flagship', badge: 'BYOK' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Open Weights Deep Reasoning', badge: 'BYOK' },
  ];

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

  const currentModelObj = models.find(m => m.id === activeModel) || models[0];

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-surface)',
        borderColor: 'var(--ide-border)',
      }}
      className="h-10 border-b px-3 flex items-center justify-between select-none z-40 text-xs relative"
    >
      {/* Left: Project Badge & Active File */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative min-w-0">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            title={`Workspace: ${activeProject.name}`}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-indigo-400 text-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 dark:border-slate-800 dark:hover:border-indigo-500/40 dark:text-slate-200 transition-all shadow-xs cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 animate-pulse" />
            <span className="truncate max-w-[140px] font-medium">{activeProject.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="absolute top-full left-0 mt-1 w-72 backdrop-blur-xl border rounded-xl shadow-2xl py-1 z-50 animate-fadeIn"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ide-text-muted)' }}>
                Workspaces
              </div>
              {projects.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchProject(p.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors cursor-pointer ${
                    p.id === activeProject.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-semibold truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-400 truncate">{p.techStack.frontend}</span>
                </button>
              ))}

              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
              <button
                onClick={() => {
                  setIsProjectDropdownOpen(false);
                  onOpenNewProject();
                }}
                className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> New Project with AI Architect...
              </button>
            </div>
          )}
        </div>

        {/* Live Dev Server Status Pill */}
        <button
          onClick={layout.togglePreview}
          className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-[11px] font-mono transition-colors dark:bg-slate-900/80 dark:border-slate-800 cursor-pointer shrink-0"
          title="Click to toggle Live Preview Sandbox"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
            {devServerProcess ? `:${devServerProcess.port || 3000}` : ':3000'}
          </span>
          <span className="text-slate-400 text-[10px]">live</span>
        </button>
      </div>

      {/* Center: Antigravity Spotlight Omnibar */}
      <div className="flex items-center flex-1 max-w-xs md:max-w-sm lg:max-w-lg mx-2 lg:mx-3 min-w-[140px]">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between gap-2 px-3 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-indigo-400 dark:bg-slate-900/80 dark:hover:bg-slate-850/90 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800 dark:hover:border-indigo-500/50 rounded-xl text-xs transition-all shadow-inner group cursor-pointer hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
          title="Open Command Palette & AI Actions (Cmd+K / Ctrl+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors shrink-0" />
            <span className="truncate text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-300 font-medium">
              Ask AI or search commands...
            </span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-600 border border-slate-200 rounded-md dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700/80 shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Cursor Composer Launcher (Cmd+I) */}
        {onOpenComposer && (
          <button
            onClick={onOpenComposer}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer shrink-0 border border-indigo-400/30 group ml-2"
            title="Open Cursor Composer (Cmd+I / Ctrl+I)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span className="hidden md:inline">Composer</span>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-black/40 text-cyan-200 rounded">⌘I</kbd>
          </button>
        )}
      </div>

      {/* Right: AI Model Chip, Actions, and Panel Toggles */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* .cursorrules Quick Launcher */}
        {onOpenCursorRules && (
          <button
            onClick={onOpenCursorRules}
            className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-purple-400 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 dark:hover:border-purple-500/40 text-xs font-mono transition-colors cursor-pointer"
            title="Open .cursorrules AI Project Constraints"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>.cursorrules</span>
          </button>
        )}
        {/* Antigravity Model Chip */}
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
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--ide-text-muted)' }}>
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

        {/* Run Tests Button */}
        <button
          onClick={runTests}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
          title="Run Vitest Suite (Cmd+T)"
        >
          <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
          <span className="hidden sm:inline font-semibold">Tests</span>
          {failedTests > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
              {failedTests} fail
            </span>
          )}
        </button>

        {/* 1-Click Self-Heal Bug Button */}
        {failedTests > 0 && (
          <button
            onClick={() => triggerSelfHealDebug()}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold shadow-md transition-all animate-pulse cursor-pointer"
            title="Trigger Automated Self-Healing Debugger"
          >
            <Sparkles className="w-3 h-3" />
            <span>Auto-Fix</span>
          </button>
        )}

        {/* Workspace Layout Preset Dropdown */}
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
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ide-text-muted)' }}>
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

        {/* Color Theme Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 text-xs font-medium transition-colors cursor-pointer shadow-xs"
            title="Switch IDE Color Theme"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/20 dark:ring-white/20"
              style={{ backgroundColor: themeEngine.activeTheme.colors.accent }}
            />
            <span className="truncate max-w-[95px] font-medium">{themeEngine.activeTheme.name}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
          </button>

          {isThemeDropdownOpen && (
            <div
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="absolute top-full right-0 mt-1 w-72 backdrop-blur-xl border rounded-xl shadow-2xl py-1.5 z-50 max-h-96 overflow-y-auto animate-fadeIn"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b" style={{ color: 'var(--ide-text-muted)', borderColor: 'var(--ide-border)' }}>
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3 h-3" style={{ color: 'var(--ide-accent)' }} />
                  <span>Color Themes</span>
                </div>
                <span className="font-mono text-[9px]">{Object.keys(THEME_REGISTRY).length} Modes</span>
              </div>

              {/* 1. Antigravity Studio Themes */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Antigravity Studio Themes</span>
              </div>
              {[
                'antigravity',
                'antigravity-monochrome',
                'antigravity-cyber',
                'antigravity-nebula',
                'antigravity-solar',
                'antigravity-titanium',
                'antigravity-frost',
                'antigravity-studio',
              ].map(id => {
                const th = THEME_REGISTRY[id];
                if (!th) return null;
                const isSelected = themeEngine.themeId === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      themeEngine.setTheme(th.id);
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {/* 3-color palette swatch */}
                      <div className="flex items-center -space-x-1 shrink-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                          style={{ backgroundColor: th.colors.bg }}
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                          style={{ backgroundColor: th.colors.surfaceElevated }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shadow-xs z-10"
                          style={{ backgroundColor: th.colors.accent }}
                        />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate font-medium">{th.name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{th.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {th.category}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* 2. Developer Classics */}
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Developer Classics
              </div>
              {[
                'monochrome',
                'dark',
                'one-dark',
                'dracula',
                'nord',
                'monokai',
                'solarized-dark',
                'solarized-light',
                'github-dark',
                'github-light',
                'light',
                'midnight',
                'abyss',
              ].map(id => {
                const th = THEME_REGISTRY[id];
                if (!th) return null;
                const isSelected = themeEngine.themeId === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      themeEngine.setTheme(th.id);
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex items-center -space-x-1 shrink-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                          style={{ backgroundColor: th.colors.bg }}
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                          style={{ backgroundColor: th.colors.surfaceElevated }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shadow-xs z-10"
                          style={{ backgroundColor: th.colors.accent }}
                        />
                      </div>
                      <span className="truncate font-medium">{th.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {th.category}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* 3. Accessibility & High Contrast */}
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                High Contrast (WCAG AAA)
              </div>
              {[
                'high-contrast-dark',
                'high-contrast-light',
              ].map(id => {
                const th = THEME_REGISTRY[id];
                if (!th) return null;
                const isSelected = themeEngine.themeId === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      themeEngine.setTheme(th.id);
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex items-center -space-x-1 shrink-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-white/50"
                          style={{ backgroundColor: th.colors.bg }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-white/50 shadow-xs z-10"
                          style={{ backgroundColor: th.colors.accent }}
                        />
                      </div>
                      <span className="truncate font-medium">{th.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        AAA
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Voice Coding Instant Launcher */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 dark:border-rose-500/40 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer group"
          title="Voice Coding & Speech Navigation"
        >
          <Mic className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Voice</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

        {/* Quick Panel Toggle Buttons */}
        <div className="flex items-center gap-1">
          {/* Toggle Primary Sidebar */}
          <button
            onClick={layout.togglePrimarySidebar}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layout.config.primarySidebarVisible
                ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
            title="Toggle Primary Sidebar (Cmd+B)"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Bottom Terminal Panel */}
          <button
            onClick={layout.toggleBottomPanel}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layout.config.bottomPanelVisible
                ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
            title="Toggle Bottom Terminal Dock (Cmd+`)"
          >
            <PanelBottom className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Secondary AI Panel */}
          <button
            onClick={layout.toggleSecondarySidebar}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layout.config.secondarySidebarVisible
                ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
            title="Toggle AI Assistant Panel (Cmd+Alt+B)"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Live Preview */}
          <button
            onClick={layout.togglePreview}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layout.config.previewVisible
                ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
            title="Toggle Live Sandbox Preview (Cmd+Shift+V)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Zen Mode */}
          <button
            onClick={layout.toggleZenMode}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layout.config.isZenMode
                ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
            title="Toggle Zen / Distraction-Free Mode (Cmd+Shift+Z)"
          >
            {layout.config.isZenMode ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
