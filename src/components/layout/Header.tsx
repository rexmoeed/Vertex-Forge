import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  Play,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Bot,
  Sun,
  Moon,
  Keyboard,
  ExternalLink,
  ChevronDown,
  Layers,
  ShieldCheck,
  RotateCcw,
  Zap,
  Search,
} from 'lucide-react';
import { AutonomyMode, OrchestratorStatus } from '../../types/ide';

interface HeaderProps {
  onOpenShortcuts: () => void;
  onOpenNewProject: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts, onOpenNewProject, onOpenCommandPalette }) => {
  const {
    activeProject,
    projects,
    switchProject,
    autonomyMode,
    setAutonomyMode,
    orchestratorStatus,
    activeAgent,
    runTests,
    triggerSelfHealDebug,
    showPreview,
    setShowPreview,
    theme,
    toggleTheme,
    testResults,
    problems,
    setIsAcceptanceModalOpen,
    isControlPanelOpen,
    setIsControlPanelOpen,
  } = useIDE();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isAutonomyDropdownOpen, setIsAutonomyDropdownOpen] = useState(false);

  const failedTests = testResults.filter(t => t.status === 'failed').length;

  const getStatusBadge = (status: OrchestratorStatus) => {
    switch (status) {
      case 'planning':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3" /> Architect Planning
          </span>
        );
      case 'executing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
            <Zap className="w-3 h-3" /> Agent Coding
          </span>
        );
      case 'testing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Play className="w-3 h-3" /> Verifying Tests
          </span>
        );
      case 'self_correcting':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            <Wrench className="w-3 h-3" /> Self-Healing Debug
          </span>
        );
      case 'awaiting_approval':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" /> Needs Human Approval
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Verified & Green
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Idle
          </span>
        );
    }
  };

  return (
    <header className="h-12 border-b border-slate-800 bg-slate-950 px-3 flex items-center justify-between select-none z-30">
      {/* Left: Window Controls, Branding & Project Selector */}
      <div className="flex items-center gap-3">
        {/* Native-style macOS Window Control Dots */}
        <div className="hidden sm:flex items-center gap-1.5 mr-1">
          <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 cursor-pointer transition-colors shadow-sm" title="Close Workspace" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 cursor-pointer transition-colors shadow-sm" title="Minimize Window" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 cursor-pointer transition-colors shadow-sm" title="Maximize Window" />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-xs tracking-tighter">
            N
          </div>
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
            Vertex<span className="text-emerald-400">Forge</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
              Desktop v2.4
            </span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="max-w-[160px] truncate">{activeProject.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Workspaces & Repositories
              </div>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchProject(p.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors ${
                    p.id === activeProject.id ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-medium truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-400 truncate">{p.techStack.frontend}</span>
                </button>
              ))}

              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => {
                  setIsProjectDropdownOpen(false);
                  onOpenNewProject();
                }}
                className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:bg-indigo-600/10 font-medium flex items-center gap-1.5"
              >
                <span>+</span> Create / Describe New Project...
              </button>
            </div>
          )}
        </div>

        {/* Current Active Agent Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-500">Agent:</span>
          <span className="font-semibold text-indigo-300">{activeAgent}</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger & Autonomy Status Banner */}
      <div className="flex items-center gap-2">
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900/90 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-lg text-xs transition-colors shadow-inner w-56 xl:w-72 justify-between"
            title="Open Command Palette & Quick File Search (Cmd+K / Ctrl+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">{activeProject.name} — Search files & actions</span>
            </div>
            <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>
        )}

        {getStatusBadge(orchestratorStatus)}

        {/* Autonomy Mode Selector */}
        <div className="relative">
          <button
            onClick={() => setIsAutonomyDropdownOpen(!isAutonomyDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700/60"
            title="Configure Autonomous Agent Permission Boundary"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{autonomyMode}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {isAutonomyDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 flex flex-col gap-1">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1">Agent Autonomy Level</div>
              <button
                onClick={() => {
                  setAutonomyMode('assist');
                  setIsAutonomyDropdownOpen(false);
                }}
                className={`text-left p-2 rounded text-xs transition-colors ${
                  autonomyMode === 'assist' ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Assist Mode</span>
                  {autonomyMode === 'assist' && <span className="text-[10px] text-indigo-400">Active</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Proposes diffs; waits for user approval for all changes.</div>
              </button>

              <button
                onClick={() => {
                  setAutonomyMode('supervised');
                  setIsAutonomyDropdownOpen(false);
                }}
                className={`text-left p-2 rounded text-xs transition-colors ${
                  autonomyMode === 'supervised' ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Supervised (Default)</span>
                  {autonomyMode === 'supervised' && <span className="text-[10px] text-indigo-400">Active</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Executes safe reads/edits; prompts for terminal execution & deletions.</div>
              </button>

              <button
                onClick={() => {
                  setAutonomyMode('autonomous');
                  setIsAutonomyDropdownOpen(false);
                }}
                className={`text-left p-2 rounded text-xs transition-colors ${
                  autonomyMode === 'autonomous' ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Autonomous Agent</span>
                  {autonomyMode === 'autonomous' && <span className="text-[10px] text-indigo-400">Active</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Executes multi-step plans, builds, and automated self-healing loops end-to-end.</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Diagnostics, Theme */}
      <div className="flex items-center gap-2">
        {/* Acceptance Tests Button */}
        <button
          onClick={() => setIsAcceptanceModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-md text-xs font-semibold transition-colors"
          title="Run 10 Acceptance Test Specification Workflows"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Acceptance Tests (10)</span>
        </button>

        {/* Project Control Panel Toggle */}
        <button
          onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            isControlPanelOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle Project Control Panel"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden xl:inline">Control Panel</span>
        </button>

        {/* Run Tests Button */}
        <button
          onClick={runTests}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors"
          title="Run Vitest / Test Suite"
        >
          <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
          <span className="hidden sm:inline">Run Tests</span>
          {failedTests > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
              {failedTests} fail
            </span>
          )}
        </button>

        {/* Self-Heal Bug Trigger (Showcases autonomous error fixing loop) */}
        {failedTests > 0 && (
          <button
            onClick={() => triggerSelfHealDebug()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-md text-xs font-semibold shadow-md transition-all animate-bounce"
            title="1-Click Autonomous Self-Healing Debugger"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Fix Bug ({failedTests})</span>
          </button>
        )}

        {/* Live Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
            showPreview
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle Live App Preview"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="hidden md:inline">Preview</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-900 transition-colors"
          title="Keyboard Shortcuts (Cmd/Ctrl + /)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-900 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
