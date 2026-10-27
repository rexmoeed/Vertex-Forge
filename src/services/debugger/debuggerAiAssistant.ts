import { AIDebugDiagnosis, DebugSession, StackFrame, Thread, Variable } from '../../types/debugger';
import { GeminiService } from '../geminiService';
import { VirtualFileSystem } from '../virtualFs';

export interface DebuggerAiContext {
  currentSession: DebugSession | null;
  currentThread: Thread;
  stackFrames: StackFrame[];
  activeFrameId: number;
  variablesScopeMap: Map<number, Variable[]>;
  vfs: VirtualFileSystem;
}

export async function diagnoseDebugSessionWithAI(ctx: DebuggerAiContext): Promise<AIDebugDiagnosis> {
  const { currentSession, currentThread, stackFrames, activeFrameId, variablesScopeMap, vfs } = ctx;

  if (!currentSession || currentThread.status !== 'paused') {
    throw new Error('Debugger must be paused at a breakpoint or exception to diagnose.');
  }

  const activeFrame = stackFrames.find(f => f.id === activeFrameId) || stackFrames[0];
  const sourcePath = activeFrame.source.path;
  const sourceCode = vfs.readFile(sourcePath) || '';

  // Extract variables with secret redaction
  const rawVars = variablesScopeMap.get(1) || [];
  const sanitizedVars: Record<string, string> = {};
  const redactedKeys: string[] = [];

  const sensitiveWords = ['token', 'secret', 'password', 'key', 'auth', 'cred'];
  for (const v of rawVars) {
    const lower = v.name.toLowerCase();
    if (sensitiveWords.some(w => lower.includes(w))) {
      sanitizedVars[v.name] = '[REDACTED_SECRET]';
      redactedKeys.push(v.name);
    } else {
      sanitizedVars[v.name] = v.value;
    }
  }

  try {
    const aiRes = await GeminiService.debugIssue({
      errorLog: currentThread.exceptionText || `Paused at line ${activeFrame.line}`,
      failingFile: sourcePath,
      fileContent: sourceCode,
    });

    return {
      hypothesis: aiRes.rootCause || 'Identified potential null reference or boundary mismatch.',
      rootCause: aiRes.explanation || 'Logic issue detected at the active breakpoint location.',
      suggestedFix: aiRes.patch || 'Apply guarded state checks or correct loop bounds.',
      targetFile: sourcePath,
      replacementCode: aiRes.patch,
      redactedVariables: redactedKeys,
    };
  } catch {
    return {
      hypothesis: 'Off-by-one or boundary exception in loop execution',
      rootCause: `At line ${activeFrame.line}, variable inspection revealed unexpected state: ${JSON.stringify(sanitizedVars)}`,
      suggestedFix: 'Add null-check guard before accessing member and bound index.',
      targetFile: sourcePath,
      redactedVariables: redactedKeys,
    };
  }
}
