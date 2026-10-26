import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Play,
  RotateCw,
  Sparkles,
  Trash2,
  Copy,
  CheckCircle2,
  X,
  Sliders,
  Send,
} from 'lucide-react';
import { TerminalService, TerminalSession } from '../../../services/terminalService';
import { CursorService } from '../../../services/cursorService';
import { useIDE } from '../../../context/IDEContext';

export interface IntegratedTerminalTabProps {
  workspaceCwd: string;
}

export const IntegratedTerminalTab: React.FC<IntegratedTerminalTabProps> = ({ workspaceCwd }) => {
  const { vfs, triggerSelfHealDebug } = useIDE();

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

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.logs]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim() || !activeSession) return;
    const cmd = inputCmd.trim();
    setInputCmd('');

    await TerminalService.executeCommand(activeSession, cmd, vfs, updated => {
      setSessions(prev => prev.map(s => (s.id === updated.id ? { ...updated } : s)));
    });
  };

  const handleInterrupt = async () => {
    if (!activeSession) return;
    await TerminalService.interruptCommand(activeSession, updated => {
      setSessions(prev => prev.map(s => (s.id === updated.id ? { ...updated } : s)));
    });
  };

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

  const handleAddSession = () => {
    const newSession = TerminalService.createDefaultSession(workspaceCwd);
    newSession.title = `${newSession.shell} ${sessions.length + 1}`;
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const handleCloseSession = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sessions.length <= 1) return;
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

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

  const handleCopyErrors = () => {
    if (!activeSession) return;
    const errorDetails = TerminalService.extractErrorContext(activeSession);
    navigator.clipboard.writeText(errorDetails);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleSendToAI = () => {
    if (!activeSession) return;
    const errorDetails = TerminalService.extractErrorContext(activeSession);
    triggerSelfHealDebug(errorDetails);
  };

  return (
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
              className="text-[10px] px-1.5 py-0.5 rounded border focus:outline-none"
            >
              <option value="powershell">PowerShell</option>
              <option value="cmd">Command Prompt</option>
              <option value="bash">Bash</option>
              <option value="zsh">Zsh</option>
            </select>
          </div>

          <div
            className="max-w-[180px] sm:max-w-[240px] truncate text-[10px] font-mono opacity-60"
            title={activeSession?.cwd}
          >
            {activeSession?.cwd}
          </div>

          <div className="flex items-center gap-1 border-l pl-2" style={{ borderColor: 'var(--ide-border)' }}>
            <button
              onClick={() => setIsTerminalAIOpen(!isTerminalAIOpen)}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 flex items-center gap-1 transition"
              title="Generate command with AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI</span>
            </button>

            <button
              onClick={() => {
                if (!activeSession) return;
                activeSession.logs = [];
                setSessions(prev => prev.map(s => (s.id === activeSession.id ? { ...activeSession } : s)));
              }}
              className="p-1 hover:text-rose-400 rounded opacity-60 hover:opacity-100 transition"
              title="Clear terminal logs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Natural Language AI Command Bar Overlay */}
      {isTerminalAIOpen && (
        <form
          onSubmit={handleTerminalAISubmit}
          className="p-2 border-b bg-indigo-950/40 border-indigo-500/30 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={terminalAIPrompt}
            onChange={e => setTerminalAIPrompt(e.target.value)}
            placeholder="Type task in English (e.g. 'kill port 3000', 'undo last commit', 'build production')..."
            className="flex-1 bg-transparent text-xs text-white placeholder-indigo-300/50 focus:outline-none font-sans"
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Generate</span>
          </button>
          <button
            type="button"
            onClick={() => setIsTerminalAIOpen(false)}
            className="p-1 hover:text-white text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Terminal Output Log Area */}
      <div
        className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text"
        style={{ fontSize: `${terminalSettings.fontSize}px` }}
      >
        {activeSession?.logs.map((log, idx) => (
          <div
            key={idx}
            className={`break-words whitespace-pre-wrap ${
              log.type === 'stderr'
                ? 'text-rose-400 font-semibold'
                : log.type === 'input'
                ? 'text-indigo-400 font-bold'
                : log.type === 'system'
                ? 'text-amber-400/90 italic'
                : 'text-slate-300'
            }`}
          >
            {log.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Command Prompt Input */}
      <form onSubmit={handleCommandSubmit} className="p-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--ide-border)' }}>
        <span className="text-emerald-400 font-bold select-none pl-1">$</span>
        <input
          type="text"
          value={inputCmd}
          onChange={e => setInputCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeSession?.isRunning ? 'Process executing... (Ctrl+C to interrupt)' : 'Enter command...'}
          disabled={activeSession?.isRunning}
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
        />
        {activeSession?.isRunning && (
          <button
            type="button"
            onClick={handleInterrupt}
            className="px-2 py-0.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded text-[10px] font-bold border border-rose-500/40"
          >
            Ctrl+C (Stop)
          </button>
        )}
      </form>
    </div>
  );
};
