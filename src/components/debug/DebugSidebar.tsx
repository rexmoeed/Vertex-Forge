import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Code2,
  Check,
  X,
  Settings,
  Cpu,
} from 'lucide-react';
import { Breakpoint, StackFrame, Variable, WatchExpression, DebugConfiguration } from '../../types/debugger';

export const DebugSidebar: React.FC = () => {
  const {
    debuggerEngine,
    debugSession,
    debugThread,
    debugBreakpoints,
    debugStackFrames,
    debugVariables,
    debugWatchExpressions,
    diagnoseCrashWithAI,
    aiDebugDiagnosis,
    applyAIDebugFix,
    openFile,
  } = useIDE();

  // Collapsible section state
  const [isVariablesOpen, setIsVariablesOpen] = useState(true);
  const [isWatchOpen, setIsWatchOpen] = useState(true);
  const [isCallStackOpen, setIsCallStackOpen] = useState(true);
  const [isBreakpointsOpen, setIsBreakpointsOpen] = useState(true);
  const [isRuntimesOpen, setIsRuntimesOpen] = useState(false);

  // Watch input state
  const [newWatchInput, setNewWatchInput] = useState('');
  const [isAddingWatch, setIsAddingWatch] = useState(false);

  // Configuration state
  const configurations: DebugConfiguration[] = debuggerEngine?.getConfigurations() || [];
  const [selectedConfigName, setSelectedConfigName] = useState<string>(
    debuggerEngine?.getActiveConfigName() || configurations[0]?.name || 'Launch Current File'
  );

  const runtimes = debuggerEngine?.getRuntimes() || [];

  const handleStartDebug = () => {
    debuggerEngine?.startSession(selectedConfigName);
  };

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchInput.trim()) return;
    debuggerEngine?.addWatchExpression(newWatchInput.trim());
    setNewWatchInput('');
    setIsAddingWatch(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none overflow-y-auto text-xs">
      {/* 1. TOP LAUNCH CONFIGURATION BAR */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Run & Debug
          </span>
          <button
            onClick={() => setIsRuntimesOpen(!isRuntimesOpen)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
            title="Inspect host runtime adapters"
          >
            <Cpu className="w-3 h-3" />
            <span>Adapters</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={selectedConfigName}
            onChange={e => {
              setSelectedConfigName(e.target.value);
              debuggerEngine?.setActiveConfigName(e.target.value);
            }}
            className="flex-1 bg-slate-950 border border-slate-750 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono truncate cursor-pointer"
          >
            {configurations.map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {!debugSession || debugSession.status === 'stopped' ? (
            <button
              onClick={handleStartDebug}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 shadow transition cursor-pointer"
              title="Start Debugging Session (F5)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => debuggerEngine?.stopSession()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1 shadow transition cursor-pointer"
              title="Stop Debugging (Shift+F5)"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Runtimes & Adapters Inspector Drawer */}
      {isRuntimesOpen && (
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-2 text-[11px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white">Installed Debugger Adapters</span>
            <button onClick={() => setIsRuntimesOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5 font-mono">
            {runtimes.map((r: any) => (
              <div
                key={r.language}
                className={`p-2 rounded border flex flex-col gap-0.5 ${
                  r.isAvailable
                    ? 'bg-slate-950 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{r.language}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                      r.isAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {r.isAvailable ? 'Ready' : 'Missing'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Adapter: {r.adapterName}</div>
                {r.version && <div className="text-[10px] text-slate-500">Version: {r.version}</div>}
                {r.reasonIfNotAvailable && (
                  <div className="text-[9px] text-amber-400">{r.reasonIfNotAvailable}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Debug Diagnosis Card */}
      {aiDebugDiagnosis && (
        <div className="m-3 p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Debug Diagnosis</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-300 uppercase px-1.5 py-0.5 rounded bg-indigo-900/60">
              Analysis
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans">{aiDebugDiagnosis.hypothesis}</p>
          <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 font-mono">
            <span className="text-emerald-400 block font-bold">Fix:</span>
            <span>{aiDebugDiagnosis.suggestedFix}</span>
          </div>
          {aiDebugDiagnosis.replacementCode && (
            <button
              onClick={applyAIDebugFix}
              className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg font-bold text-xs shadow cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Fix & Restart</span>
            </button>
          )}
        </div>
      )}

      {/* 2. VARIABLES SECTION */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => setIsVariablesOpen(!isVariablesOpen)}
          className="w-full px-3 py-2 flex items-center justify-between text-slate-400 hover:text-white font-bold text-[11px] uppercase tracking-wider bg-slate-900/30 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            {isVariablesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Variables</span>
          </div>
          {debugVariables?.length > 0 && (
            <span className="text-[10px] text-slate-500 font-mono">{debugVariables.length}</span>
          )}
        </button>

        {isVariablesOpen && (
          <div className="p-2 space-y-1 font-mono text-[11px]">
            {(!debugVariables || debugVariables.length === 0) ? (
              <div className="text-slate-500 italic p-2 text-center text-[10px]">
                {debugSession ? 'Step into code to inspect scope variables' : 'No active debug session'}
              </div>
            ) : (
              debugVariables.map((v: Variable) => (
                <div
                  key={v.name}
                  className="p-1 rounded hover:bg-slate-900 flex items-center justify-between text-[11px]"
                >
                  <span className="text-cyan-300 font-semibold">{v.name}:</span>
                  <span className="text-emerald-400 font-mono truncate max-w-[140px] text-right">
                    {v.value}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. WATCH EXPRESSIONS SECTION */}
      <div className="border-b border-slate-800">
        <div className="px-3 py-2 flex items-center justify-between text-slate-400 font-bold text-[11px] uppercase tracking-wider bg-slate-900/30">
          <button
            onClick={() => setIsWatchOpen(!isWatchOpen)}
            className="flex items-center gap-1.5 hover:text-white cursor-pointer"
          >
            {isWatchOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Watch</span>
          </button>
          <button
            onClick={() => setIsAddingWatch(!isAddingWatch)}
            className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Add Watch Expression"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isWatchOpen && (
          <div className="p-2 space-y-1.5">
            {isAddingWatch && (
              <form onSubmit={handleAddWatch} className="flex gap-1">
                <input
                  type="text"
                  value={newWatchInput}
                  onChange={e => setNewWatchInput(e.target.value)}
                  placeholder="e.g. prices.length, total > 100"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                >
                  Add
                </button>
              </form>
            )}

            {(!debugWatchExpressions || debugWatchExpressions.length === 0) ? (
              <div className="text-slate-500 italic p-2 text-center text-[10px]">
                No watch expressions added
              </div>
            ) : (
              debugWatchExpressions.map((w: WatchExpression) => (
                <div
                  key={w.id}
                  className="p-1 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono"
                >
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-slate-300 font-bold">{w.expression}:</span>
                    <span className={w.error ? 'text-rose-400' : 'text-emerald-400'}>
                      {w.error ? `Error` : w.value || 'undefined'}
                    </span>
                  </div>
                  <button
                    onClick={() => debuggerEngine?.removeWatchExpression(w.id)}
                    className="p-0.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                    title="Remove expression"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. CALL STACK SECTION */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => setIsCallStackOpen(!isCallStackOpen)}
          className="w-full px-3 py-2 flex items-center justify-between text-slate-400 hover:text-white font-bold text-[11px] uppercase tracking-wider bg-slate-900/30 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            {isCallStackOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Call Stack</span>
          </div>
          {debugStackFrames?.length > 0 && (
            <span className="text-[10px] text-slate-500 font-mono">{debugStackFrames.length} frames</span>
          )}
        </button>

        {isCallStackOpen && (
          <div className="p-2 space-y-1 font-mono text-[11px]">
            {(!debugStackFrames || debugStackFrames.length === 0) ? (
              <div className="text-slate-500 italic p-2 text-center text-[10px]">
                {debugSession ? 'Running thread...' : 'Not debugging'}
              </div>
            ) : (
              debugStackFrames.map((frame: StackFrame, idx: number) => (
                <div
                  key={frame.id}
                  onClick={() => {
                    debuggerEngine?.selectStackFrame(frame.id);
                    openFile(frame.source.path);
                  }}
                  className={`p-1.5 rounded cursor-pointer flex flex-col gap-0.5 border transition ${
                    idx === 0
                      ? 'bg-indigo-950/60 border-indigo-500/40 text-white'
                      : 'bg-slate-900/40 border-transparent hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">{frame.name}</span>
                    <span className="text-[10px] text-slate-400">:{frame.line}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate">{frame.source.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 5. BREAKPOINTS SECTION */}
      <div className="border-b border-slate-800">
        <div className="px-3 py-2 flex items-center justify-between text-slate-400 font-bold text-[11px] uppercase tracking-wider bg-slate-900/30">
          <button
            onClick={() => setIsBreakpointsOpen(!isBreakpointsOpen)}
            className="flex items-center gap-1.5 hover:text-white cursor-pointer"
          >
            {isBreakpointsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Breakpoints</span>
          </button>
          {debugBreakpoints?.length > 0 && (
            <button
              onClick={() => debuggerEngine?.clearAllBreakpoints()}
              className="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer"
              title="Remove All Breakpoints"
            >
              Clear All
            </button>
          )}
        </div>

        {isBreakpointsOpen && (
          <div className="p-2 space-y-1">
            {(!debugBreakpoints || debugBreakpoints.length === 0) ? (
              <div className="text-slate-500 italic p-2 text-center text-[10px]">
                Click on the editor line gutter to add breakpoints
              </div>
            ) : (
              debugBreakpoints.map((bp: Breakpoint) => (
                <div
                  key={bp.id}
                  className="p-1.5 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={bp.enabled}
                      onChange={e => debuggerEngine?.setBreakpointEnabled(bp.id, e.target.checked)}
                      className="rounded accent-rose-500 cursor-pointer"
                    />
                    <div
                      onClick={() => openFile(bp.filePath)}
                      className="cursor-pointer truncate text-slate-300 hover:text-white"
                      title={bp.filePath}
                    >
                      <span className="font-bold text-white">{bp.filePath.split('/').pop()}</span>
                      <span className="text-rose-400 ml-1">:{bp.line}</span>
                      {bp.condition && (
                        <span className="ml-1 text-[9px] text-amber-300 bg-amber-950/60 px-1 rounded border border-amber-500/30">
                          {bp.condition}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => debuggerEngine?.removeBreakpoint(bp.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                    title="Remove breakpoint"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
