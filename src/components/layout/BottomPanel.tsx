import { IntegratedTerminalTab } from './bottom/IntegratedTerminalTab';
import { ProblemsTab } from './bottom/ProblemsTab';
import { AuditTrailTab } from './bottom/AuditTrailTab';
import React, { useState, useRef, useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import {
  Terminal as TerminalIcon,
  AlertCircle,
  FlaskConical,
  ShieldCheck,
  History,
  X,
  ChevronUp,
  ChevronDown,
  Play,
  Sparkles,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Maximize2,
  Minimize2,
  Plus,
  Copy,
  Send,
  Sliders,
  RotateCw,
  Bug,
} from 'lucide-react';
import { TerminalService, TerminalSession } from '../../services/terminalService';
import { DesktopBridge } from '../../services/desktopBridge';
import { useTheme } from '../../context/ThemeContext';
import { DebugConsole } from '../debug/DebugConsole';
import { TestExplorerPanel } from '../testing/TestExplorerPanel';
import { SecurityAuditorPanel } from '../security/SecurityAuditorPanel';
import { CursorService } from '../../services/cursorService';

export const BottomPanel: React.FC = () => {
  const layout = useLayout();
  const themeEngine = useTheme();
  const {
    bottomPanelTab,
    setBottomPanelTab,
    isBottomPanelOpen,
    toggleBottomPanel,
    terminalHistory,
    runCommand,
    clearTerminal,
    testResults,
    problems,
    agentLogs,
    triggerSelfHealDebug,
    runTests,
    runLint,
    runSecurityReview,
    codeReviewResult,
    openFile,
    activeProject,
    vfs,
    debugConsoleMessages,
    debugSession,
  } = useIDE();

  // Multi-Session Terminal Management
  const workspaceCwd = DesktopBridge.currentWorkspacePath || ((typeof process !== 'undefined' && process.cwd) ? process.cwd() : 'E:\\Vertex Forge\\Vertex-Forge-main');
  const [sessions, setSessions] = useState<TerminalSession[]>(() => {
    const defaultSess = TerminalService.createDefaultSession(workspaceCwd);
    const s1: TerminalSession = {
      ...defaultSess,
      id: 'term-powershell',
      title: 'powershell',
      shell: 'powershell',
      logs: [],
      isRunning: false,
    };
    return [s1];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>('term-powershell');
  const [inputCmd, setInputCmd] = useState('');
  const [terminalSettings, setTerminalSettings] = useState(() => TerminalService.loadSettings());
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isTerminalAIOpen, setIsTerminalAIOpen] = useState(false);
  const [terminalAIPrompt, setTerminalAIPrompt] = useState('');

  const handleTerminalAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalAIPrompt.trim()) return;
    const generatedCmd = CursorService.synthesizeTerminalCommand(terminalAIPrompt);
    setInputCmd(generatedCmd);
    setIsTerminalAIOpen(false);
    setTerminalAIPrompt('');
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom on new output
  useEffect(() => {
    if (bottomPanelTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.logs, bottomPanelTab]);

  // Terminal Command Execution with Real Process runner
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim() || !activeSession) return;
    const cmd = inputCmd.trim();
    setInputCmd('');

    await TerminalService.executeCommand(activeSession, cmd, vfs, updated => {
      setSessions(prev => prev.map(s => (s.id === updated.id ? { ...updated } : s)));
    });
  };

  // Interrupt currently running command
  const handleInterrupt = async () => {
    if (!activeSession) return;
    await TerminalService.interruptCommand(activeSession, updated => {
      setSessions(prev => prev.map(s => (s.id === updated.id ? { ...updated } : s)));
    });
  };

  // Keyboard navigation for history (Arrow Up / Down) & Ctrl+C interrupt
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      if (activeSession?.isRunning) {
        e.preventDefault();
        handleInterrupt();
        return;
      }
    }

    if (!activeSession || activeSession.history.length === 0) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx =
        activeSession.historyIndex === -1
          ? activeSession.history.length - 1
          : Math.max(0, activeSession.historyIndex - 1);
      activeSession.historyIndex = nextIdx;
      setInputCmd(activeSession.history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeSession.historyIndex !== -1) {
        const nextIdx = activeSession.historyIndex + 1;
        if (nextIdx >= activeSession.history.length) {
          activeSession.historyIndex = -1;
          setInputCmd('');
        } else {
          activeSession.historyIndex = nextIdx;
          setInputCmd(activeSession.history[nextIdx] || '');
        }
      }
    }
  };

  // Create new terminal session
  const handleAddSession = () => {
    const newSession = TerminalService.createDefaultSession(workspaceCwd);
    newSession.title = `${newSession.shell} ${sessions.length + 1}`;
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  // Close terminal session
  const handleCloseSession = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sessions.length <= 1) return;
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Switch shell for active session
  const handleShellChange = (newShell: 'bash' | 'zsh' | 'powershell' | 'cmd') => {
    if (!activeSession) return;
    activeSession.shell = newShell;
    activeSession.title = `${newShell} ${sessions.findIndex(s => s.id === activeSession.id) + 1}`;
    activeSession.logs.push({
      type: 'system',
      text: `Switched session shell to ${newShell}`,
      timestamp: new Date().toLocaleTimeString(),
    });
    setSessions(prev => prev.map(s => (s.id === activeSession.id ? { ...activeSession } : s)));
  };

  // Copy error details
  const handleCopyErrors = () => {
    if (!activeSession) return;
    const errorDetails = TerminalService.extractErrorContext(activeSession);
    navigator.clipboard.writeText(errorDetails);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  // Send error details to AI Assistant
  const handleSendToAI = () => {
    if (!activeSession) return;
    const errorDetails = TerminalService.extractErrorContext(activeSession);
    triggerSelfHealDebug(errorDetails);
  };

  const failedTests = testResults.filter((t: any) => t.status === 'failed').length;

  if (!isBottomPanelOpen) {
    return (
      <div
        style={{
          backgroundColor: 'var(--ide-surface)',
          borderColor: 'var(--ide-border)',
          color: 'var(--ide-text-muted)',
        }}
        className="h-7 border-t px-3 flex items-center justify-between select-none text-xs"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              toggleBottomPanel();
              setBottomPanelTab('terminal');
            }}
            className="flex items-center gap-1 hover:text-slate-200"
          >
            <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Terminal</span>
          </button>
          <button
            onClick={() => {
              toggleBottomPanel();
              setBottomPanelTab('problems');
            }}
            className="flex items-center gap-1 hover:text-slate-200"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Problems ({problems.length})</span>
          </button>
          <button
            onClick={() => {
              toggleBottomPanel();
              setBottomPanelTab('tests');
            }}
            className="flex items-center gap-1 hover:text-slate-200"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tests ({testResults.length})</span>
          </button>
        </div>

        <button onClick={toggleBottomPanel} className="p-1 hover:text-slate-200">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        height: layout.config.bottomPanelMaximized ? '100%' : `${layout.config.bottomPanelHeight}px`,
        backgroundColor: 'var(--ide-terminal-bg)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-text)',
      }}
      className="border-t overflow-hidden flex flex-col z-20 shrink-0 shadow-sm"
    >
      {/* 1. BOTTOM PANEL TABS HEADER */}
      <div
        style={{
          backgroundColor: 'var(--ide-surface)',
          borderColor: 'var(--ide-border)',
        }}
        className="h-8 border-b px-3 flex items-center justify-between select-none overflow-x-auto scrollbar-none"
      >
        <div className="flex items-center gap-1.5 h-full shrink-0">
          {/* Problems Tab */}
          <button
            onClick={() => setBottomPanelTab('problems')}
            className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              bottomPanelTab === 'problems'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Problems</span>
            {problems.length > 0 && (
              <span className="text-[10px] font-bold text-amber-400">
                {problems.length}
              </span>
            )}
          </button>

          {/* Output Tab */}
          <button
            onClick={() => setBottomPanelTab('audit')}
            className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              bottomPanelTab === 'audit'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Output</span>
          </button>

          {/* Debug Console Tab */}
          <button
            onClick={() => setBottomPanelTab('debug')}
            className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              bottomPanelTab === 'debug'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Debug Console</span>
          </button>

          {/* Terminal Tab */}
          <button
            onClick={() => setBottomPanelTab('terminal')}
            className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              bottomPanelTab === 'terminal'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Terminal</span>
          </button>

          {/* Ports Tab */}
          <button
            onClick={() => setBottomPanelTab('ports')}
            className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              bottomPanelTab === 'ports'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Ports</span>
          </button>

          {/* Tests Tab (compact) */}
          <button
            onClick={() => setBottomPanelTab('tests')}
            className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
              bottomPanelTab === 'tests'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tests</span>
            {failedTests > 0 && (
              <span className="ml-1 text-[10px] text-rose-400 font-bold">{failedTests}</span>
            )}
          </button>
        </div>

        {/* Panel controls matching user screenshot 4 */}
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          {/* Active Shell Pill */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
            <span className="text-white/60">&gt;_</span>
            <span>{activeSession?.shell || 'powershell'}</span>
          </div>

          <button
            onClick={handleAddSession}
            className="hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer flex items-center gap-0.5"
            title="New Terminal Session"
          >
            <Plus className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {/* Kill Session Trash */}
          <button
            onClick={(e) => handleCloseSession(activeSessionId, e)}
            className="hover:text-rose-400 p-1 rounded hover:bg-white/10 cursor-pointer"
            title="Kill Terminal Session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <span className="text-white/20 select-none">|</span>

          {/* Maximize / Restore Toggle */}
          <button
            onClick={layout.toggleBottomPanelMaximized}
            className="hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
            title={layout.config.bottomPanelMaximized ? 'Restore Panel' : 'Maximize Panel'}
          >
            {layout.config.bottomPanelMaximized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Close Panel Button */}
          <button
            onClick={layout.toggleBottomPanel}
            className="hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. PANEL CONTENT */}
      <div className="flex-1 overflow-hidden relative">
        {/* TAB 1: INTERACTIVE MULTI-SESSION TERMINAL */}
        {bottomPanelTab === 'terminal' && (
          <IntegratedTerminalTab workspaceCwd={workspaceCwd} />
        )}

        {bottomPanelTab === 'problems' && (
          <ProblemsTab />
        )}

        {bottomPanelTab === 'tests' && (
          <TestExplorerPanel embedded={true} />
        )}

        {/* TAB 4: CODE REVIEW & SECURITY AUDITOR */}
        {bottomPanelTab === 'review' && (
          <div className="h-full w-full overflow-hidden">
            <SecurityAuditorPanel />
          </div>
        )}

        {/* TAB 5: AGENT AUDIT LOG */}
        {bottomPanelTab === 'audit' && (
          <AuditTrailTab />
        )}

        {bottomPanelTab === 'debug' && (
          <div className="h-full w-full overflow-hidden">
            <DebugConsole />
          </div>
        )}
      </div>
    </div>
  );
};
