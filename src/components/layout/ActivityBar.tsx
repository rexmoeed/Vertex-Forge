import React from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import {
  Home,
  Code2,
  Files,
  Search,
  GitBranch,
  FlaskConical,
  Users,
  Palette,
  Settings,
  ShieldCheck,
  Key,
  History,
  Bug,
  Activity,
  PlayCircle,
  Blocks,
} from 'lucide-react';

export const ActivityBar: React.FC = () => {
  const layout = useLayout();
  const {
    activeView,
    setActiveView,
    activeSidebarTab,
    setActiveSidebarTab,
    modifiedFiles,
    testResults,
    hasApiKey,
    debugSession,
    setBottomPanelTab,
    isBottomPanelOpen,
    toggleBottomPanel,
  } = useIDE();

  const failedTests = testResults.filter((t) => t.status === 'failed').length;

  const handleTabClick = (tab: string) => {
    if (activeView === 'editor' && activeSidebarTab === tab && layout.config.primarySidebarVisible) {
      layout.togglePrimarySidebar();
    } else {
      setActiveView('editor');
      setActiveSidebarTab(tab);
      if (!layout.config.primarySidebarVisible) {
        layout.togglePrimarySidebar();
      }
    }
  };

  return (
    <aside
      style={{
        backgroundColor: 'var(--ide-surface)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-text)',
      }}
      className="w-12 border-r flex flex-col justify-between items-center py-2 select-none z-20 shrink-0 self-stretch h-full min-h-0"
    >
      {/* Top Primary View Destinations */}
      <div className="flex flex-col items-center gap-1 w-full overflow-y-auto no-scrollbar min-h-0 py-1">
        {/* Welcome / Dashboard */}
        <button
          onClick={() => setActiveView('welcome')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeView === 'welcome'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Welcome & Quickstart"
        >
          {activeView === 'welcome' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Home className="w-5 h-5" />
        </button>

        {/* Code Editor */}
        <button
          onClick={() => handleTabClick('explorer')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'editor' && activeSidebarTab === 'explorer' && layout.config.primarySidebarVisible
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Explorer (Ctrl+Shift+E)"
        >
          {activeView === 'editor' && activeSidebarTab === 'explorer' && layout.config.primarySidebarVisible && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Files className="w-5 h-5" />
        </button>

        {/* Search */}
        <button
          onClick={() => handleTabClick('search')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'editor' && activeSidebarTab === 'search' && layout.config.primarySidebarVisible
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Search in Codebase (Ctrl+Shift+F)"
        >
          {activeView === 'editor' && activeSidebarTab === 'search' && layout.config.primarySidebarVisible && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Search className="w-5 h-5" />
        </button>

        {/* Git Source Control */}
        <button
          onClick={() => handleTabClick('git')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'editor' && activeSidebarTab === 'git' && layout.config.primarySidebarVisible
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Source Control (Ctrl+Shift+G)"
        >
          {activeView === 'editor' && activeSidebarTab === 'git' && layout.config.primarySidebarVisible && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <GitBranch className="w-5 h-5" />
          {modifiedFiles.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-black bg-[var(--ide-accent,#00ff88)]">
              {modifiedFiles.length}
            </span>
          )}
        </button>

        {/* Test Explorer */}
        <button
          onClick={() => handleTabClick('tests')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'editor' && activeSidebarTab === 'tests' && layout.config.primarySidebarVisible
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Test Runner & Assertions (Ctrl+T)"
        >
          {activeView === 'editor' && activeSidebarTab === 'tests' && layout.config.primarySidebarVisible && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <FlaskConical className="w-5 h-5" />
          {failedTests > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-rose-600">
              {failedTests}
            </span>
          )}
        </button>

        {/* Run & Debug (DAP Multi-Language Debugger) */}
        <button
          onClick={() => handleTabClick('debug')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'editor' && activeSidebarTab === 'debug' && layout.config.primarySidebarVisible
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Run & Debug (Ctrl+Shift+D)"
        >
          {activeView === 'editor' && activeSidebarTab === 'debug' && layout.config.primarySidebarVisible && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <PlayCircle className="w-5 h-5" />
          {debugSession && debugSession.status !== 'stopped' && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-slate-100 dark:ring-slate-950" />
          )}
        </button>

        {/* Extensions */}
        <button
          onClick={() => handleTabClick('extensions')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'editor' && activeSidebarTab === 'extensions' && layout.config.primarySidebarVisible
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Extensions & Plugins (Ctrl+Shift+X)"
        >
          {activeView === 'editor' && activeSidebarTab === 'extensions' && layout.config.primarySidebarVisible && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Blocks className="w-5 h-5" />
        </button>

        <div className="w-6 h-[1px] bg-slate-200 dark:bg-slate-800 my-1" />

        {/* Hierarchical Agent Teams */}
        <button
          onClick={() => setActiveView('agents')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'agents'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Specialist AI Team Hierarchy (10 Leads)"
        >
          {activeView === 'agents' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Users className="w-5 h-5 text-indigo-400" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-black bg-[var(--ide-accent,#00ff88)]">
            10
          </span>
        </button>

        {/* AI Provider Hub (BYOK) */}
        <button
          onClick={() => setActiveView('providers')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'providers'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="AI Provider Hub & BYOK Keys (Claude, OpenAI, Gemini)"
        >
          {activeView === 'providers' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Key className="w-5 h-5 text-amber-400" />
        </button>

        {/* Code Evolution Map */}
        <button
          onClick={() => setActiveView('evolution')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'evolution'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Code Evolution Map (Git History, Churn & Hotspots)"
        >
          {activeView === 'evolution' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <History className="w-5 h-5 text-indigo-400" />
        </button>

        {/* Bug Detective Cross-Layer Debugger */}
        <button
          onClick={() => setActiveView('bug-detective')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'bug-detective'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Bug Detective (Cross-Layer Diagnosis & Fixes)"
        >
          {activeView === 'bug-detective' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Bug className="w-5 h-5 text-rose-400" />
        </button>

        {/* Production Watchdog */}
        <button
          onClick={() => setActiveView('watchdog')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'watchdog'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Production Watchdog (Observability & Incidents)"
        >
          {activeView === 'watchdog' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Activity className="w-5 h-5 text-amber-400" />
        </button>

        {/* Operator Console (KOS Parity) */}
        <button
          onClick={() => setActiveView('operator')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'operator'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Operator Console (Approvals, Vault, Rulebook, Council & Trackers)"
        >
          {activeView === 'operator' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </button>

        {/* Design System Studio */}
        <button
          onClick={() => setActiveView('design-system')}
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            activeView === 'design-system'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Design System & Tokens Studio"
        >
          {activeView === 'design-system' && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--ide-accent,#00ff88)] rounded-r shadow-[0_0_8px_var(--ide-accent)]" />
          )}
          <Palette className="w-5 h-5 text-cyan-400" />
        </button>
      </div>

      {/* Bottom Icons: Antigravity AI Core, Security & Settings */}
      <div className="flex flex-col items-center gap-2">
        {/* Antigravity AI Core Indicator Badge */}
        <button
          onClick={() => setActiveView('agents')}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/60 border border-[var(--ide-accent,#00ff88)]/40 hover:border-[var(--ide-accent,#00ff88)] shadow-sm cursor-pointer group transition-all"
          title="✦ Antigravity Autonomous Core (Agents & Multi-Step Execution)"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--ide-accent,#00ff88)] group-hover:scale-125 transition-transform animate-pulse shadow-[0_0_8px_var(--ide-accent,#00ff88)]" />
        </button>

        <button
          onClick={() => {
            setBottomPanelTab('review');
            if (!isBottomPanelOpen) toggleBottomPanel();
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          title="Security & Dependency Auditor (Live Static & Supply-Chain Scan)"
        >
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black"></span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('settings')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeView === 'settings'
              ? 'text-[var(--ide-accent,#00ff88)] bg-slate-800/60 shadow-inner'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Studio Settings & Security"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
