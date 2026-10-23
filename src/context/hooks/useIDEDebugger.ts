import { useState, useCallback, useMemo } from 'react';
import { DebuggerEngine } from '../../services/debuggerEngine';
import { VirtualFileSystem } from '../../services/virtualFs';
import { DesktopBridge } from '../../services/desktopBridge';
import {
  Breakpoint,
  StackFrame,
  Variable,
  WatchExpression,
  Thread,
  DebugSession,
  DebugConsoleMessage,
  AIDebugDiagnosis,
} from '../../types/debugger';
import { UIContextType } from '../UIContext';
import { AgentContextType } from '../AgentContext';

export interface UseIDEDebuggerProps {
  vfs: VirtualFileSystem;
  ui: UIContextType;
  openFile: (path: string) => Promise<any>;
  agent: AgentContextType;
  updateFileContent: (content: string) => void;
}

export function useIDEDebugger({ vfs, ui, openFile, agent, updateFileContent }: UseIDEDebuggerProps) {
  const [debugSession, setDebugSession] = useState<DebugSession | null>(null);
  const [debugThread, setDebugThread] = useState<Thread | null>(null);
  const [debugBreakpoints, setDebugBreakpoints] = useState<Breakpoint[]>([]);
  const [debugStackFrames, setDebugStackFrames] = useState<StackFrame[]>([]);
  const [debugVariables, setDebugVariables] = useState<Variable[]>([]);
  const [debugWatchExpressions, setDebugWatchExpressions] = useState<WatchExpression[]>([]);
  const [debugConsoleMessages, setDebugConsoleMessages] = useState<DebugConsoleMessage[]>([]);
  const [debugLocation, setDebugLocation] = useState<{ filePath: string; line: number } | null>(null);
  const [aiDebugDiagnosis, setAiDebugDiagnosis] = useState<AIDebugDiagnosis | null>(null);

  const debuggerEngine = useMemo(() => {
    const engine = new DebuggerEngine(vfs);
    engine.setEvents({
      onSessionStateChange: session => {
        setDebugSession(session ? { ...session } : null);
        if (session && session.status !== 'stopped') {
          ui.setActiveSidebarTab('debugger');
          ui.setBottomPanelTab('debugConsole');
          ui.setIsBottomPanelOpen(true);
        }
      },
      onThreadStateChange: thread => setDebugThread({ ...thread }),
      onBreakpointsChange: bps => setDebugBreakpoints([...bps]),
      onStackFramesChange: frames => setDebugStackFrames([...frames]),
      onVariablesChange: vars => setDebugVariables([...vars]),
      onWatchExpressionsChange: watches => setDebugWatchExpressions([...watches]),
      onConsoleOutput: msg => setDebugConsoleMessages(prev => [...prev, msg]),
      onActiveLocationChange: loc => {
        setDebugLocation(loc);
        if (loc) {
          openFile(loc.filePath);
        }
      },
    });
    setDebugBreakpoints(engine.getBreakpoints());
    setDebugWatchExpressions(engine.getWatchExpressions());
    return engine;
  }, [vfs, ui, openFile]);

  const diagnoseCrashWithAI = useCallback(async () => {
    try {
      const diag = await debuggerEngine.diagnoseWithAI();
      setAiDebugDiagnosis(diag);
      agent.logAgentAction('Debugger', `AI Diagnosis completed: ${diag.hypothesis}`, 'info', diag.suggestedFix);
    } catch (err: any) {
      agent.logAgentAction('Debugger', `AI Diagnosis failed: ${err.message}`, 'error');
    }
  }, [debuggerEngine, agent]);

  const applyAIDebugFix = useCallback(async () => {
    if (!aiDebugDiagnosis || !aiDebugDiagnosis.replacementCode) return;
    const { targetFile, replacementCode } = aiDebugDiagnosis;
    vfs.writeFile(targetFile, replacementCode);
    try {
      await DesktopBridge.writeFile(targetFile, replacementCode);
    } catch {}
    updateFileContent(replacementCode);
    agent.logAgentAction('Debugger', `Applied AI patch to ${targetFile}. Restarting debug session...`, 'success');
    setAiDebugDiagnosis(null);
    debuggerEngine.restartSession();
  }, [aiDebugDiagnosis, vfs, debuggerEngine, updateFileContent, agent]);

  const toggleBreakpoint = useCallback((filePath: string, line: number) => {
    debuggerEngine.toggleBreakpoint(filePath, line);
  }, [debuggerEngine]);

  return {
    debuggerEngine,
    debugSession,
    debugThread,
    debugBreakpoints,
    debugStackFrames,
    debugVariables,
    debugWatchExpressions,
    debugConsoleMessages,
    debugLocation,
    aiDebugDiagnosis,
    diagnoseCrashWithAI,
    applyAIDebugFix,
    toggleBreakpoint,
  };
}
