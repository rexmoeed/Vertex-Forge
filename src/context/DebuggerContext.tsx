import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import {
  DebugSession,
  Thread,
  Breakpoint,
  StackFrame,
  Variable,
  WatchExpression,
  DebugConsoleMessage,
  AIDebugDiagnosis,
} from '../types/debugger';
import { DebuggerEngine } from '../services/debuggerEngine';
import { VirtualFileSystem } from '../services/virtualFs';
import { DesktopBridge } from '../services/desktopBridge';

export interface DebuggerContextType {
  debugSession: DebugSession | null;
  debugThread: Thread;
  debugBreakpoints: Breakpoint[];
  debugStackFrames: StackFrame[];
  debugVariables: Variable[];
  debugWatchExpressions: WatchExpression[];
  debugConsoleMessages: DebugConsoleMessage[];
  debugLocation: { filePath: string; line: number; column: number } | null;
  aiDebugDiagnosis: AIDebugDiagnosis | null;
  debuggerEngine: DebuggerEngine;

  toggleBreakpoint: (filePath: string, line: number) => void;
  diagnoseCrashWithAI: () => Promise<void>;
  applyAIDebugFix: () => Promise<void>;
  startDebugging: (config?: any) => Promise<void>;
  stopDebugging: () => Promise<void>;
}

const DebuggerContext = createContext<DebuggerContextType | null>(null);

export interface DebuggerProviderProps {
  children: ReactNode;
  vfs: VirtualFileSystem;
  onOpenFile?: (path: string) => void;
  onLogAction?: (agent: string, action: string, status?: any, details?: any) => void;
  onFilePatched?: (path: string, code: string) => void;
}

export const DebuggerProvider: React.FC<DebuggerProviderProps> = ({
  children,
  vfs,
  onOpenFile,
  onLogAction,
  onFilePatched,
}) => {
  const [debugSession, setDebugSession] = useState<DebugSession | null>(null);
  const [debugThread, setDebugThread] = useState<Thread>({ id: 1, name: 'main', status: 'running' });
  const [debugBreakpoints, setDebugBreakpoints] = useState<Breakpoint[]>([]);
  const [debugStackFrames, setDebugStackFrames] = useState<StackFrame[]>([]);
  const [debugVariables, setDebugVariables] = useState<Variable[]>([]);
  const [debugWatchExpressions, setDebugWatchExpressions] = useState<WatchExpression[]>([]);
  const [debugConsoleMessages, setDebugConsoleMessages] = useState<DebugConsoleMessage[]>([]);
  const [debugLocation, setDebugLocation] = useState<{ filePath: string; line: number; column: number } | null>(null);
  const [aiDebugDiagnosis, setAiDebugDiagnosis] = useState<AIDebugDiagnosis | null>(null);

  const debuggerEngine = useMemo(() => {
    const engine = new DebuggerEngine(vfs);
    engine.setEvents({
      onSessionStateChange: (session) => {
        setDebugSession(session ? { ...session } : null);
      },
      onThreadStateChange: (thread) => setDebugThread({ ...thread }),
      onBreakpointsChange: (bps) => setDebugBreakpoints([...bps]),
      onStackFramesChange: (frames) => setDebugStackFrames([...frames]),
      onVariablesChange: (vars) => setDebugVariables([...vars]),
      onWatchExpressionsChange: (watches) => setDebugWatchExpressions([...watches]),
      onConsoleOutput: (msg) => setDebugConsoleMessages((prev) => [...prev, msg]),
      onActiveLocationChange: (loc) => {
        setDebugLocation(loc);
        if (loc && onOpenFile) {
          onOpenFile(loc.filePath);
        }
      },
    });
    setDebugBreakpoints(engine.getBreakpoints());
    setDebugWatchExpressions(engine.getWatchExpressions());
    return engine;
  }, [vfs, onOpenFile]);

  const toggleBreakpoint = useCallback((filePath: string, line: number) => {
    debuggerEngine.toggleBreakpoint(filePath, line);
  }, [debuggerEngine]);

  const diagnoseCrashWithAI = useCallback(async () => {
    try {
      const diagnosis = await debuggerEngine.diagnoseWithAI();
      setAiDebugDiagnosis(diagnosis);
      onLogAction?.('Debugger', `AI Diagnosis completed: ${diagnosis.hypothesis}`, 'info', diagnosis.suggestedFix);
    } catch (err: any) {
      onLogAction?.('Debugger', `AI Diagnosis failed: ${err.message}`, 'error');
    }
  }, [debuggerEngine, onLogAction]);

  const applyAIDebugFix = useCallback(async () => {
    if (!aiDebugDiagnosis || !aiDebugDiagnosis.replacementCode) return;
    const { targetFile, replacementCode } = aiDebugDiagnosis;
    vfs.writeFile(targetFile, replacementCode);
    try {
      await DesktopBridge.writeFile(targetFile, replacementCode);
    } catch {}
    onFilePatched?.(targetFile, replacementCode);
    onLogAction?.('Debugger', `Applied AI patch to ${targetFile}. Restarting debug session...`, 'success');
    setAiDebugDiagnosis(null);
    debuggerEngine.restartSession();
  }, [aiDebugDiagnosis, vfs, debuggerEngine, onFilePatched, onLogAction]);

  const startDebugging = useCallback(async (config?: any) => {
    await debuggerEngine.startSession(config);
  }, [debuggerEngine]);

  const stopDebugging = useCallback(async () => {
    await debuggerEngine.stopSession();
  }, [debuggerEngine]);

  const value: DebuggerContextType = {
    debugSession,
    debugThread,
    debugBreakpoints,
    debugStackFrames,
    debugVariables,
    debugWatchExpressions,
    debugConsoleMessages,
    debugLocation,
    aiDebugDiagnosis,
    debuggerEngine,
    toggleBreakpoint,
    diagnoseCrashWithAI,
    applyAIDebugFix,
    startDebugging,
    stopDebugging,
  };

  return <DebuggerContext.Provider value={value}>{children}</DebuggerContext.Provider>;
};

export function useDebugger(): DebuggerContextType {
  const ctx = useContext(DebuggerContext);
  if (!ctx) {
    throw new Error('useDebugger must be used within a DebuggerProvider');
  }
  return ctx;
}
