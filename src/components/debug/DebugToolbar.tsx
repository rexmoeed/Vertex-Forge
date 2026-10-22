import React from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  Play,
  Pause,
  CornerDownRight,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Square,
  Sparkles,
} from 'lucide-react';

export const DebugToolbar: React.FC = () => {
  const {
    debuggerEngine,
    debugSession,
    debugThread,
    diagnoseCrashWithAI,
  } = useIDE();

  if (!debugSession || debugSession.status === 'stopped') {
    return null;
  }

  const isPaused = debugThread?.status === 'paused';

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-surface-elevated)',
        borderColor: 'var(--ide-border)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
      className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-2 py-1.5 rounded-xl border flex items-center gap-1 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 select-none text-xs"
    >
      <div className="flex items-center gap-1.5 px-2 border-r border-slate-750 font-mono text-[11px]">
        <div
          className={`w-2 h-2 rounded-full ${
            isPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
          }`}
        />
        <span className="text-slate-300 font-bold truncate max-w-[120px]">
          {debugSession.name}
        </span>
      </div>

      {/* Continue / Pause */}
      {isPaused ? (
        <button
          onClick={() => debuggerEngine.continue()}
          className="p-1.5 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors"
          title="Continue (F5)"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      ) : (
        <button
          onClick={() => debuggerEngine.pause()}
          className="p-1.5 rounded hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
          title="Pause (F6)"
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
        </button>
      )}

      {/* Step Over */}
      <button
        onClick={() => debuggerEngine.stepOver()}
        disabled={!isPaused}
        className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-cyan-400 hover:text-cyan-300 transition-colors"
        title="Step Over (F10)"
      >
        <CornerDownRight className="w-3.5 h-3.5" />
      </button>

      {/* Step Into */}
      <button
        onClick={() => debuggerEngine.stepInto()}
        disabled={!isPaused}
        className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-cyan-400 hover:text-cyan-300 transition-colors"
        title="Step Into (F11)"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>

      {/* Step Out */}
      <button
        onClick={() => debuggerEngine.stepOut()}
        disabled={!isPaused}
        className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-cyan-400 hover:text-cyan-300 transition-colors"
        title="Step Out (Shift+F11)"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>

      {/* Restart */}
      <button
        onClick={() => debuggerEngine.restartSession()}
        className="p-1.5 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
        title="Restart Session (Ctrl+Shift+F5)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Stop */}
      <button
        onClick={() => debuggerEngine.stopSession()}
        className="p-1.5 rounded hover:bg-slate-800 text-rose-500 hover:text-rose-400 transition-colors"
        title="Stop Session (Shift+F5)"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
      </button>

      {/* AI Debugger Button */}
      {isPaused && (
        <button
          onClick={diagnoseCrashWithAI}
          className="ml-1 px-2 py-1 rounded bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition"
          title="Ask AI to analyze paused stack & fix code"
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Fix</span>
        </button>
      )}
    </div>
  );
};
