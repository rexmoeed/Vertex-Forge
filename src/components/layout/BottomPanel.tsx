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
          <div
            style={{
              backgroundColor: 'var(--ide-terminal-bg)',
              color: 'var(--ide-terminal-text)',
            }}
            className="h-full flex flex-col font-mono text-xs transition-colors duration-150"
          >
            {/* Terminal Session Tabs Bar */}
            <div
              style={{
                backgroundColor: 'var(--ide-surface)',
                borderColor: 'var(--ide-border)',
              }}
              className="px-2 pt-1 border-b flex items-center justify-between gap-2 overflow-x-auto select-none"
            >
              <div className="flex items-center gap-1">
                {sessions.map(s => {
                  const isCur = s.id === activeSessionId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSessionId(s.id)}
                      style={{
                        backgroundColor: isCur ? 'var(--ide-terminal-bg)' : 'transparent',
                        borderColor: isCur ? 'var(--ide-border)' : 'transparent',
                        color: isCur ? 'var(--ide-terminal-text)' : 'var(--ide-text-muted)',
                      }}
                      className={`px-2.5 py-1 rounded-t-md text-[11px] flex items-center gap-1.5 transition-colors border-t border-x cursor-pointer ${
                        isCur ? 'font-semibold shadow-xs' : 'hover:opacity-80'
                      }`}
                    >
                      <span>{s.title}</span>
                      {sessions.length > 1 && (
                        <span
                          onClick={e => handleCloseSession(s.id, e)}
                          className="hover:text-rose-400 ml-1 rounded-full p-0.5 opacity-60 hover:opacity-100"
                          title="Close session"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={handleAddSession}
                  style={{ color: 'var(--ide-text-muted)' }}
                  className="p-1 hover:text-slate-900 dark:hover:text-white rounded ml-1 cursor-pointer transition-colors"
                  title="New Terminal Session"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Shell switcher & CWD display */}
              <div className="flex items-center gap-3 text-[11px] font-sans pb-1">
                <div className="flex items-center gap-1" style={{ color: 'var(--ide-text-muted)' }}>
                  <span className="text-[10px] opacity-75">Shell:</span>
                  <select
                    value={activeSession?.shell || 'bash'}
                    onChange={e => handleShellChange(e.target.value as 'bash' | 'zsh' | 'powershell' | 'cmd')}
                    style={{
                      backgroundColor: 'var(--ide-surface-elevated)',
                      borderColor: 'var(--ide-border)',
                      color: 'var(--ide-text)',
                    }}
                    className="border rounded px-1.5 py-0.5 text-[11px] font-mono cursor-pointer"
                  >
                    <option value="bash">bash</option>
                    <option value="zsh">zsh</option>
                    <option value="powershell">powershell</option>
                    <option value="cmd">cmd.exe</option>
                  </select>
                </div>

                <div
                  className="hidden lg:flex items-center gap-1 font-mono text-[10px] truncate max-w-xs"
                  style={{ color: 'var(--ide-text-muted)' }}
                >
                  <span>cwd:</span>
                  <span className="truncate" style={{ color: 'var(--ide-text)' }}>{activeSession?.cwd}</span>
                </div>

                {/* Cursor Terminal AI Command Launcher */}
                <div className="relative">
                  <button
                    onClick={() => setIsTerminalAIOpen(!isTerminalAIOpen)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono transition-colors cursor-pointer"
                    title="Generate Terminal Command with AI (Cmd+K)"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
                    <span>AI Command</span>
                    <kbd className="text-[9px] px-1 bg-indigo-100 dark:bg-black/40 text-indigo-800 dark:text-indigo-200 rounded">⌘K</kbd>
                  </button>

                  {isTerminalAIOpen && (
                    <form
                      onSubmit={handleTerminalAISubmit}
                      className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/50 rounded-xl p-2.5 shadow-2xl z-50 flex flex-col gap-2 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-900 dark:text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                          <span>Cursor Terminal AI</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsTerminalAIOpen(false)}
                          className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <input
                        type="text"
                        autoFocus
                        value={terminalAIPrompt}
                        onChange={e => setTerminalAIPrompt(e.target.value)}
                        placeholder="e.g. 'kill port 3000', 'run test watch'..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 focus:border-indigo-500 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono outline-none"
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                        <span>Press Enter to synthesize</span>
                        <button
                          type="submit"
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer"
                        >
                          Generate
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Quick command pills & Actions bar */}
            <div
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
              }}
              className="px-3 py-1.5 border-b flex items-center justify-between gap-2 overflow-x-auto no-scrollbar"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold mr-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{DesktopBridge.isElectron ? 'Native Shell (Win32)' : 'Native Bridge'}</span>
                </span>
                <span className="text-[10px] uppercase font-sans font-semibold mr-1" style={{ color: 'var(--ide-text-muted)' }}>Quick:</span>
                {['npm install', 'npm run dev', 'npm test', 'npm run build', 'git status', 'git diff', 'clear'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => {
                      if (activeSession) {
                        TerminalService.executeCommand(activeSession, cmd, vfs, updated => {
                          setSessions(prev => prev.map(s => (s.id === updated.id ? { ...updated } : s)));
                        });
                      }
                    }}
                    style={{
                      backgroundColor: 'var(--ide-surface)',
                      borderColor: 'var(--ide-border)',
                      color: 'var(--ide-text)',
                    }}
                    className="px-2 py-0.5 rounded text-[11px] border hover:opacity-80 transition-colors shrink-0 cursor-pointer"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {/* Copy Error & Send to AI buttons */}
              <div className="flex items-center gap-2 shrink-0 font-sans">
                <button
                  onClick={handleCopyErrors}
                  style={{
                    backgroundColor: 'var(--ide-surface)',
                    borderColor: 'var(--ide-border)',
                    color: 'var(--ide-text)',
                  }}
                  className="px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 transition cursor-pointer hover:opacity-85"
                  title="Copy terminal error output"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>{copiedNotice ? 'Copied!' : 'Copy Error'}</span>
                </button>

                <button
                  onClick={handleSendToAI}
                  style={{
                    backgroundColor: 'var(--ide-accent)',
                    color: '#ffffff',
                  }}
                  className="px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow transition cursor-pointer hover:opacity-90"
                  title="Send terminal error to AI Debugger"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Send to AI</span>
                </button>
              </div>
            </div>

            {/* Terminal Main Area Split: Logs & Prompt on Left, Session List on Right */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Left Column: Logs & Interactive Prompt */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Terminal Output Stream */}
                <div
                  style={{
                    fontSize: `${terminalSettings.fontSize}px`,
                    backgroundColor: 'var(--ide-terminal-bg)',
                    color: 'var(--ide-terminal-text)',
                  }}
                  className="flex-1 p-3 overflow-y-auto space-y-1 font-mono transition-colors duration-150"
                >
                  {activeSession?.logs.map((line, idx) => {
                    const isViteHmr = line.text.includes('[vite]') || line.text.includes('hmr update');
                    return (
                      <div
                        key={idx}
                        className={`leading-relaxed whitespace-pre-wrap ${
                          line.type === 'input'
                            ? 'font-bold'
                            : line.type === 'stderr'
                            ? 'font-semibold'
                            : line.type === 'system'
                            ? 'opacity-90'
                            : ''
                        }`}
                        style={{
                          color: isViteHmr
                            ? '#00ff88'
                            : line.type === 'input'
                            ? '#ffffff'
                            : line.type === 'stderr'
                            ? 'var(--ide-error)'
                            : line.type === 'system'
                            ? '#00ff88'
                            : 'var(--ide-terminal-text)',
                        }}
                      >
                        {line.type === 'input' && !line.text.startsWith('PS ') ? `$ ${line.text}` : line.text}
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>

                {/* Interactive command input prompt */}
                <form
                  onSubmit={handleCommandSubmit}
                  style={{
                    backgroundColor: 'var(--ide-surface)',
                    borderColor: 'var(--ide-border)',
                  }}
                  className="border-t px-3 py-1.5 flex items-center gap-2 transition-colors duration-150 shrink-0"
                >
                  <span className="text-[#00ff88] font-bold select-none text-xs">
                    PS {activeSession?.cwd || 'E:\\Vertex Forge\\Vertex-Forge-main'}&gt;
                  </span>
                  <input
                    type="text"
                    value={inputCmd}
                    onChange={e => setInputCmd(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="npm test, git status, node -v..."
                    style={{
                      color: 'var(--ide-terminal-text)',
                    }}
                    className="flex-1 bg-transparent focus:outline-none text-xs font-mono placeholder:text-slate-500"
                  />
                  {activeSession?.isRunning && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-emerald-400 animate-pulse font-sans flex items-center gap-1">
                        <RotateCw className="w-3 h-3 animate-spin" /> Running
                      </span>
                      <button
                        type="button"
                        onClick={handleInterrupt}
                        className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                        title="Interrupt command execution (Ctrl+C)"
                      >
                        <span>Ctrl+C</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Right Column: Terminal Sessions Split List (Matching screenshot) */}
              <div
                style={{
                  backgroundColor: 'var(--ide-surface)',
                  borderColor: 'var(--ide-border)',
                }}
                className="w-32 border-l flex flex-col py-1 shrink-0 select-none font-mono text-xs"
              >
                {sessions.map(s => {
                  const isCur = s.id === activeSessionId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSessionId(s.id)}
                      className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2 transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                      }`}
                    >
                      <span className="text-slate-400 text-[11px]">&gt;_</span>
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROBLEMS & DIAGNOSTICS */}
        {bottomPanelTab === 'problems' && (
          <div
            style={{
              backgroundColor: 'var(--ide-terminal-bg)',
              color: 'var(--ide-text)',
            }}
            className="h-full flex flex-col p-3 overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-300">
                Workspace Diagnostics ({problems.length} issues)
              </span>
              <button
                onClick={runLint}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-transparent rounded text-xs transition cursor-pointer"
              >
                Re-scan Workspace
              </button>
            </div>

            {problems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-1 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>No problems found in workspace files.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {problems.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => openFile({ workspaceId: activeProject?.id || 'workspace', path: p.filePath, source: 'quick-open', line: p.line, column: p.column })}
                            className="font-mono text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline"
                            title={`Jump to line ${p.line}, column ${p.column}`}
                          >
                            {p.filePath}:{p.line}:{p.column}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                            {p.source}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-300 mt-1">{p.message}</p>
                        {p.codeSnippet && (
                          <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-1.5 rounded mt-1.5 border border-slate-200 dark:border-slate-800">
                            {p.codeSnippet}
                          </pre>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => triggerSelfHealDebug(p.message)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Auto-Fix
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TESTS EXPLORER */}
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
          <div
            style={{
              backgroundColor: 'var(--ide-terminal-bg)',
              color: 'var(--ide-terminal-text)',
            }}
            className="h-full flex flex-col p-3 overflow-y-auto font-mono text-xs"
          >
            <div
              style={{ borderColor: 'var(--ide-border)' }}
              className="flex items-center justify-between pb-2 mb-2 border-b"
            >
              <span className="text-xs font-semibold font-sans" style={{ color: 'var(--ide-text)' }}>
                Immutable Agent Execution Ledger
              </span>
              <span className="text-[11px] font-sans" style={{ color: 'var(--ide-text-muted)' }}>
                {agentLogs.length} logged activities
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {agentLogs.map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: 'var(--ide-surface)',
                    borderColor: 'var(--ide-border)',
                  }}
                  className="p-2 rounded border flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--ide-text-muted)' }}>[{log.timestamp}]</span>
                      <span className="font-bold text-indigo-400">{log.agent}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                        log.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.status === 'error' ? 'bg-rose-500/20 text-rose-300' :
                        log.status === 'tool_call' ? 'bg-cyan-500/20 text-cyan-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    {log.targetFile && (
                      <span className="truncate max-w-[160px]" style={{ color: 'var(--ide-text-muted)' }}>{log.targetFile}</span>
                    )}
                  </div>
                  <div className="font-sans text-xs" style={{ color: 'var(--ide-text)' }}>{log.action}</div>
                  {log.details && (
                    <div
                      style={{
                        backgroundColor: 'var(--ide-surface-elevated)',
                        borderColor: 'var(--ide-border)',
                        color: 'var(--ide-terminal-text)',
                      }}
                      className="text-[11px] p-1.5 rounded border whitespace-pre-wrap"
                    >
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: DEBUG CONSOLE REPL */}
        {bottomPanelTab === 'debug' && (
          <div className="h-full w-full overflow-hidden">
            <DebugConsole />
          </div>
        )}
      </div>
    </div>
  );
};
