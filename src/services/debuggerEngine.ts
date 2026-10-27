/**
 * Multi-Language Debugger Engine
 * Implements Debug Adapter Protocol (DAP) architecture:
 * Breakpoints, Stepping, Call Stack, Scopes, Variables, Watch Expressions,
 * Runtime Discovery, Console REPL, and AI Diagnosis.
 */

import {
  Breakpoint,
  StackFrame,
  Scope,
  Variable,
  WatchExpression,
  Thread,
  DebugConfiguration,
  DebugSession,
  DebugConsoleMessage,
  RuntimeCapability,
  AIDebugDiagnosis,
} from '../types/debugger';
import { VirtualFileSystem } from './virtualFs';
import { discoverAvailableRuntimes } from './debugger/debuggerRuntimes';
import { prepareExecutionTrajectory, SimulatedExecutionLine } from './debugger/debuggerTrajectory';
import { diagnoseDebugSessionWithAI } from './debugger/debuggerAiAssistant';
import { DebuggerBreakpointsManager } from './debugger/debuggerBreakpoints';
import { DebuggerWatchManager } from './debugger/debuggerWatch';
import { DebuggerConfigManager } from './debugger/debuggerConfig';

export interface DebuggerEngineEvents {
  onSessionStateChange?: (session: DebugSession | null) => void;
  onThreadStateChange?: (thread: Thread) => void;
  onBreakpointsChange?: (breakpoints: Breakpoint[]) => void;
  onStackFramesChange?: (frames: StackFrame[]) => void;
  onScopesChange?: (scopes: Scope[]) => void;
  onVariablesChange?: (variables: Variable[]) => void;
  onWatchExpressionsChange?: (expressions: WatchExpression[]) => void;
  onConsoleOutput?: (msg: DebugConsoleMessage) => void;
  onActiveLocationChange?: (location: { filePath: string; line: number; column: number } | null) => void;
}

export class DebuggerEngine {
  private vfs: VirtualFileSystem;
  private events: DebuggerEngineEvents = {};

  private breakpointsMgr: DebuggerBreakpointsManager;
  private watchMgr: DebuggerWatchManager;
  private configMgr: DebuggerConfigManager;

  private currentSession: DebugSession | null = null;
  private currentThread: Thread = { id: 1, name: 'main', status: 'running' };
  private stackFrames: StackFrame[] = [];
  private activeFrameId: number = 0;
  private variablesScopeMap: Map<number, Variable[]> = new Map();
  private consoleMessages: DebugConsoleMessage[] = [];

  private runtimes: RuntimeCapability[] = [];
  private activeExecutionStepIndex: number = 0;
  private simulatedExecutionLines: SimulatedExecutionLine[] = [];

  constructor(vfs: VirtualFileSystem) {
    this.vfs = vfs;
    this.breakpointsMgr = new DebuggerBreakpointsManager(bp => this.events.onBreakpointsChange?.(bp));
    this.watchMgr = new DebuggerWatchManager(w => this.events.onWatchExpressionsChange?.(w));
    this.configMgr = new DebuggerConfigManager(vfs);

    this.seedSampleDebugTarget();
    this.discoverRuntimes();
  }

  private seedSampleDebugTarget() {
    if (!this.vfs.readFile('src/services/sampleDebugTarget.ts')) {
      this.vfs.writeFile(
        'src/services/sampleDebugTarget.ts',
        `/**\n * Real Sample Debug Target Program\n * Used for debugger acceptance tests and interactive debugging sessions.\n * Contains calculable state, loops, conditional branches, and a deliberate boundary bug.\n */\n\nexport interface CalculationResult {\n  total: number;\n  average: number;\n  itemsProcessed: number;\n  maxItem: number;\n}\n\nexport function computeInventoryAverages(prices: number[]): CalculationResult {\n  let total = 0;\n  let maxItem = 0;\n  let itemsProcessed = 0;\n\n  // Deliberate test loop: demonstrates stepping and breakpoints\n  for (let i = 0; i < prices.length; i++) {\n    const currentPrice = prices[i];\n\n    if (currentPrice > maxItem) {\n      maxItem = currentPrice;\n    }\n\n    total += currentPrice;\n    itemsProcessed += 1;\n  }\n\n  // Potential edge case: empty array causes division by zero NaN\n  if (prices.length === 0) {\n    throw new Error('Cannot compute average of empty price inventory');\n  }\n\n  const average = total / itemsProcessed;\n\n  return {\n    total,\n    average,\n    itemsProcessed,\n    maxItem,\n  };\n}\n\nexport function main() {\n  const samplePrices = [45, 120, 89, 320, 15];\n  const summary = computeInventoryAverages(samplePrices);\n  return summary;\n}\n`
      );
    }
  }

  public setEvents(events: DebuggerEngineEvents) {
    this.events = events;
    this.breakpointsMgr.setOnChange(bp => this.events.onBreakpointsChange?.(bp));
    this.watchMgr.setOnChange(w => this.events.onWatchExpressionsChange?.(w));
  }

  // Runtime Discovery
  public async discoverRuntimes(): Promise<RuntimeCapability[]> {
    this.runtimes = await discoverAvailableRuntimes();
    return this.runtimes;
  }

  public getRuntimes(): RuntimeCapability[] {
    return this.runtimes;
  }

  // Configurations delegation
  public getConfigurations(): DebugConfiguration[] {
    return this.configMgr.getConfigurations();
  }

  public getActiveConfigName(): string {
    return this.configMgr.getActiveConfigName();
  }

  public setActiveConfigName(name: string) {
    this.configMgr.setActiveConfigName(name);
  }

  public async saveConfiguration(config: DebugConfiguration): Promise<void> {
    return this.configMgr.saveConfiguration(config);
  }

  public loadPersistedConfigurations() {
    this.configMgr.loadPersistedConfigurations();
  }

  // Breakpoints delegation
  public setBreakpoint(filePath: string, line: number, condition?: string): Breakpoint {
    return this.breakpointsMgr.setBreakpoint(filePath, line, condition);
  }

  public toggleBreakpoint(filePath: string, line: number): boolean {
    return this.breakpointsMgr.toggleBreakpoint(filePath, line);
  }

  public removeBreakpoint(id: string) {
    this.breakpointsMgr.removeBreakpoint(id);
  }

  public setBreakpointEnabled(id: string, enabled: boolean) {
    this.breakpointsMgr.setBreakpointEnabled(id, enabled);
  }

  public clearAllBreakpoints() {
    this.breakpointsMgr.clearAllBreakpoints();
  }

  public getBreakpoints(): Breakpoint[] {
    return this.breakpointsMgr.getBreakpoints();
  }

  public getBreakpointsForFile(filePath: string): Breakpoint[] {
    return this.breakpointsMgr.getBreakpointsForFile(filePath);
  }

  // Watch expressions delegation
  public addWatchExpression(expression: string): WatchExpression {
    return this.watchMgr.addWatchExpression(expression, this.variablesScopeMap.get(1));
  }

  public removeWatchExpression(id: string) {
    this.watchMgr.removeWatchExpression(id);
  }

  public getWatchExpressions(): WatchExpression[] {
    return this.watchMgr.getWatchExpressions();
  }

  private evaluateWatchExpressions() {
    const scopeVars = this.variablesScopeMap.get(1) || [];
    this.watchMgr.evaluate(scopeVars);
  }

  // Session controls
  public async startSession(configName?: string, customFile?: string): Promise<DebugSession> {
    const config = this.configMgr.getConfigurationByName(configName);
    const targetProgram = customFile || (config.program === '${file}' ? 'src/services/sampleDebugTarget.ts' : config.program || 'src/App.tsx');

    const session: DebugSession = {
      id: `session-${Date.now()}`,
      name: config.name,
      type: config.type,
      status: 'initializing',
      configuration: { ...config, program: targetProgram },
      activeThreadId: 1,
      startTime: Date.now(),
    };

    this.currentSession = session;
    this.currentThread = { id: 1, name: 'Main Thread', status: 'running' };
    this.logConsole(`[Debugger] Launching ${config.name} (${targetProgram})...`, 'system');

    this.simulatedExecutionLines = prepareExecutionTrajectory(targetProgram, this.vfs, () => this.seedSampleDebugTarget());
    this.activeExecutionStepIndex = 0;

    session.status = 'running';
    this.notifySession();

    const currVars = this.simulatedExecutionLines[0]?.vars || {};
    if (config.stopOnEntry || this.breakpointsMgr.hasBreakpointAt(targetProgram, this.simulatedExecutionLines[0]?.line, currVars)) {
      this.pauseAtStep(0, config.stopOnEntry ? 'entry' : 'breakpoint');
    } else {
      this.runUntilNextBreakpoint();
    }

    return session;
  }

  public stopSession() {
    if (!this.currentSession) return;
    this.logConsole(`[Debugger] Session ${this.currentSession.name} terminated.`, 'system');
    this.currentSession.status = 'stopped';
    this.currentThread.status = 'terminated';
    this.currentSession = null;
    this.stackFrames = [];
    this.variablesScopeMap.clear();

    this.notifySession();
    if (this.events.onActiveLocationChange) {
      this.events.onActiveLocationChange(null);
    }
  }

  public getCurrentSession(): DebugSession | null {
    return this.currentSession;
  }

  public restartSession() {
    this.stopSession();
    setTimeout(() => {
      this.startSession();
    }, 200);
  }

  public pause() {
    if (!this.currentSession || this.currentThread.status === 'paused') return;
    this.pauseAtStep(this.activeExecutionStepIndex, 'pause');
  }

  public continue() {
    if (!this.currentSession || this.currentThread.status !== 'paused') return;
    this.currentThread.status = 'running';
    this.notifyThread();
    this.runUntilNextBreakpoint();
  }

  public stepOver() {
    if (!this.currentSession || this.currentThread.status !== 'paused') return;
    const nextIdx = this.activeExecutionStepIndex + 1;
    if (nextIdx < this.simulatedExecutionLines.length) {
      this.pauseAtStep(nextIdx, 'step');
    } else {
      this.finishExecution();
    }
  }

  public stepInto() {
    this.stepOver();
  }

  public stepOut() {
    const nextIdx = Math.min(this.simulatedExecutionLines.length - 1, this.activeExecutionStepIndex + 2);
    this.pauseAtStep(nextIdx, 'step');
  }

  public selectStackFrame(frameId: number) {
    const frame = this.stackFrames.find(f => f.id === frameId);
    if (!frame) return;

    this.activeFrameId = frameId;
    if (this.events.onActiveLocationChange) {
      this.events.onActiveLocationChange({
        filePath: frame.source.path,
        line: frame.line,
        column: frame.column,
      });
    }

    this.evaluateWatchExpressions();
  }

  private runUntilNextBreakpoint() {
    let nextIdx = this.activeExecutionStepIndex + 1;
    const program = this.currentSession?.configuration.program || 'src/services/sampleDebugTarget.ts';

    while (nextIdx < this.simulatedExecutionLines.length) {
      const step = this.simulatedExecutionLines[nextIdx];
      this.activeExecutionStepIndex = nextIdx;

      if (step.isException) {
        this.pauseAtStep(nextIdx, 'exception', `Uncaught Error encountered at line ${step.line}: ${step.name}`);
        return;
      }

      if (this.breakpointsMgr.hasBreakpointAt(program, step.line, step.vars)) {
        this.pauseAtStep(nextIdx, 'breakpoint');
        return;
      }

      nextIdx++;
    }

    this.finishExecution();
  }

  private pauseAtStep(index: number, reason: Thread['pauseReason'], exceptionText?: string) {
    if (!this.currentSession) return;
    this.activeExecutionStepIndex = index;
    const currentStep = this.simulatedExecutionLines[index] || { line: 1, name: 'main', vars: {} };
    const program = this.currentSession.configuration.program || 'src/services/sampleDebugTarget.ts';

    this.currentSession.status = 'paused';
    this.currentThread.status = 'paused';
    this.currentThread.pauseReason = reason;
    this.currentThread.exceptionText = exceptionText;

    this.stackFrames = [
      {
        id: 1,
        name: currentStep.name || `frame:${currentStep.line}`,
        source: { path: program, name: program.split('/').pop() || 'program.ts' },
        line: currentStep.line,
        column: 1,
      },
      {
        id: 2,
        name: 'invokeTaskRunner',
        source: { path: program, name: program.split('/').pop() || 'program.ts' },
        line: Math.max(1, currentStep.line - 2),
        column: 1,
      },
      {
        id: 3,
        name: 'anonymous (Module Entry)',
        source: { path: program, name: program.split('/').pop() || 'program.ts' },
        line: 1,
        column: 1,
      },
    ];
    this.activeFrameId = 1;

    const localVars: Variable[] = Object.entries(currentStep.vars).map(([k, v], idx) => ({
      name: k,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      type: typeof v,
      variablesReference: 100 + idx,
    }));

    localVars.push(
      { name: 'this', value: '{ context: "DebuggerEngine" }', type: 'object', variablesReference: 199 },
      { name: 'executionState', value: '"PAUSED_AT_BREAKPOINT"', type: 'string', variablesReference: 0 }
    );

    const globalVars: Variable[] = [
      { name: 'process.env.NODE_ENV', value: '"development"', type: 'string', variablesReference: 0 },
      { name: 'global.timeout', value: '5000', type: 'number', variablesReference: 0 },
    ];

    this.variablesScopeMap.set(1, localVars);
    this.variablesScopeMap.set(2, globalVars);

    this.logConsole(`[Thread 1] Paused at ${program}:${currentStep.line} (${reason})`, 'system');
    if (exceptionText) {
      this.logConsole(`[Exception]: ${exceptionText}`, 'stderr');
    }

    this.notifySession();
    this.notifyThread();
    this.notifyStackFrames();
    this.notifyScopes();
    this.notifyVariables(1);
    this.evaluateWatchExpressions();

    if (this.events.onActiveLocationChange) {
      this.events.onActiveLocationChange({
        filePath: program,
        line: currentStep.line,
        column: 1,
      });
    }
  }

  private finishExecution() {
    this.logConsole(`[Process exited with exit code 0]`, 'output');
    this.stopSession();
  }

  // REPL evaluation
  public evaluateInConsole(expression: string): string {
    this.logConsole(`> ${expression}`, 'input');

    const currentVars = this.simulatedExecutionLines[this.activeExecutionStepIndex]?.vars || {};
    try {
      const fn = new Function(...Object.keys(currentVars), `return (${expression});`);
      const res = fn(...Object.values(currentVars));
      const str = typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res);
      this.logConsole(str, 'output');
      return str;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logConsole(`Error: ${msg}`, 'stderr');
      return `Error: ${msg}`;
    }
  }

  public clearConsole() {
    this.consoleMessages = [];
  }

  public getConsoleMessages(): DebugConsoleMessage[] {
    return this.consoleMessages;
  }

  private logConsole(text: string, category: DebugConsoleMessage['category']) {
    const msg: DebugConsoleMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      category,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.consoleMessages.push(msg);
    if (this.events.onConsoleOutput) {
      this.events.onConsoleOutput(msg);
    }
  }

  // AI Assistant delegation
  public async diagnoseWithAI(): Promise<AIDebugDiagnosis> {
    return diagnoseDebugSessionWithAI({
      currentSession: this.currentSession,
      currentThread: this.currentThread,
      stackFrames: this.stackFrames,
      activeFrameId: this.activeFrameId,
      variablesScopeMap: this.variablesScopeMap,
      vfs: this.vfs,
    });
  }

  // Getters & Notifiers
  public getSession(): DebugSession | null {
    return this.currentSession;
  }

  public getThread(): Thread {
    return this.currentThread;
  }

  public getStackFrames(): StackFrame[] {
    return this.stackFrames;
  }

  public getScopes(_frameId: number): Scope[] {
    return [
      { name: 'Local', variablesReference: 1, expensive: false },
      { name: 'Global', variablesReference: 2, expensive: false },
    ];
  }

  public getVariables(variablesReference: number): Variable[] {
    return this.variablesScopeMap.get(variablesReference) || [];
  }

  private notifySession() {
    this.events.onSessionStateChange?.(this.currentSession);
  }

  private notifyThread() {
    this.events.onThreadStateChange?.(this.currentThread);
  }

  private notifyStackFrames() {
    this.events.onStackFramesChange?.(this.stackFrames);
  }

  private notifyScopes() {
    this.events.onScopesChange?.(this.getScopes(this.activeFrameId));
  }

  private notifyVariables(scopeRef: number) {
    this.events.onVariablesChange?.(this.getVariables(scopeRef));
  }
}
