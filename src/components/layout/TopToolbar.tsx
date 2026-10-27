import React from 'react';
import { useIDE } from '../../context/IDEContext';
import { Sparkles, Play, Mic } from 'lucide-react';
import { ToolbarWorkspaceDropdown } from './toolbar/ToolbarWorkspaceDropdown';
import { ToolbarModelDropdown } from './toolbar/ToolbarModelDropdown';
import { ToolbarPresetsDropdown } from './toolbar/ToolbarPresetsDropdown';
import { ToolbarThemeDropdown } from './toolbar/ToolbarThemeDropdown';
import { ToolbarPanelToggles } from './toolbar/ToolbarPanelToggles';

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
    runTests,
    testResults,
    triggerSelfHealDebug,
    setIsVoiceModalOpen,
  } = useIDE();

  const failedTests = testResults.filter(t => t.status === 'failed').length;

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-surface)',
        borderColor: 'var(--ide-border)',
      }}
      className="h-10 border-b px-3 flex items-center justify-between select-none z-40 text-xs relative"
    >
      {/* Left: Project Badge & Active File */}
      <ToolbarWorkspaceDropdown onOpenNewProject={onOpenNewProject} />

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
        <ToolbarModelDropdown />

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
        <ToolbarPresetsDropdown />

        {/* Color Theme Dropdown */}
        <ToolbarThemeDropdown />

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
        <ToolbarPanelToggles />
      </div>
    </div>
  );
};
