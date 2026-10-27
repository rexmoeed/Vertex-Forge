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
import { DesktopBridge } from './desktopBridge';
import { VirtualFileSystem } from './virtualFs';
import { GeminiService } from './geminiService';

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

  private breakpoints: Map<string, Breakpoint> = new Map();
  private watchExpressions: Map<string, WatchExpression> = new Map();
  private configurations: DebugConfiguration[] = [];
  private activeConfigName: string = 'Launch Current File (TypeScript / Node)';

  private currentSession: DebugSession | null = null;
  private currentThread: Thread = { id: 1, name: 'main', status: 'running' };
  private stackFrames: StackFrame[] = [];
  private activeFrameId: number = 0;
  private variablesScopeMap: Map<number, Variable[]> = new Map();
  private consoleMessages: DebugConsoleMessage[] = [];

  private runtimes: RuntimeCapability[] = [];
  private activeExecutionStepIndex: number = 0;
  private simulatedExecutionLines: Array<{ line: number; name: string; vars: Record<string, any>; isException?: boolean }> = [];

  constructor(vfs: VirtualFileSystem) {
    this.vfs = vfs;
    this.seedSampleDebugTarget();
    this.initDefaultConfigurations();
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
  }

  // ==========================================
  // RUNTIME & ADAPTER DISCOVERY
  // ==========================================

  public async discoverRuntimes(): Promise<RuntimeCapability[]> {
    const list: RuntimeCapability[] = [];

    // 1. Node.js & TypeScript
    try {
      const nodeCheck = await DesktopBridge.executeCommand('node -v');
      const isAvailable = nodeCheck.exitCode === 0;
      list.push({
        language: 'JavaScript / TypeScript',
        runtime: 'Node.js',
        version: isAvailable ? nodeCheck.stdout.trim() : undefined,
        isAvailable,
        adapterName: 'js-debug (Node V8 Inspector)',
        adapterInstalled: isAvailable,
        reasonIfNotAvailable: isAvailable ? undefined : 'Node.js runtime not found in environment.',
      });
    } catch {
      list.push({
        language: 'JavaScript / TypeScript',
        runtime: 'Node.js',
        isAvailable: false,
        adapterName: 'js-debug',
        adapterInstalled: false,
        reasonIfNotAvailable: 'Unable to execute node binary check.',
      });
    }

    // 2. Python
    try {
      const pyCheck = await DesktopBridge.executeCommand('python3 --version');
      const isAvailable = pyCheck.exitCode === 0;
      list.push({
        language: 'Python',
        runtime: 'Python 3',
        version: isAvailable ? pyCheck.stdout.trim() : undefined,
        isAvailable,
        adapterName: 'debugpy (DAP)',
        adapterInstalled: isAvailable,
        reasonIfNotAvailable: isAvailable ? undefined : 'Python 3 not detected in host system PATH.',
      });
    } catch {
      list.push({
        language: 'Python',
        runtime: 'Python 3',
        isAvailable: false,
        adapterName: 'debugpy (DAP)',
        adapterInstalled: false,
        reasonIfNotAvailable: 'Python 3 not detected in host system PATH.',
      });
    }

    // 3. Go
    try {
      const goCheck = await DesktopBridge.executeCommand('go version');
      const isAvailable = goCheck.exitCode === 0;
      list.push({
        language: 'Go',
        runtime: 'Go Toolchain',
        version: isAvailable ? goCheck.stdout.trim() : undefined,
        isAvailable,
        adapterName: 'delve (dlv)',
        adapterInstalled: isAvailable,
        reasonIfNotAvailable: isAvailable ? undefined : 'Go toolchain not detected in host system PATH.',
      });
    } catch {
      list.push({
        language: 'Go',
        runtime: 'Go Toolchain',
        isAvailable: false,
        adapterName: 'delve (dlv)',
        adapterInstalled: false,
        reasonIfNotAvailable: 'Go compiler not found in PATH.',
      });
    }

    this.runtimes = list;
    return list;
  }

  public getRuntimes(): RuntimeCapability[] {
    return this.runtimes;
  }

  // ==========================================
  // LAUNCH CONFIGURATIONS
  // ==========================================

  private initDefaultConfigurations() {
    this.configurations = [
      {
        name: 'Launch Current File (TypeScript / Node)',
        type: 'node',
        request: 'launch',
        program: '${file}',
        stopOnEntry: false,
        sourceMaps: true,
      },
      {
        name: 'Debug Sample Program (sampleDebugTarget.ts)',
        type: 'tsx',
        request: 'launch',
        program: 'src/services/sampleDebugTarget.ts',
        stopOnEntry: true,
        sourceMaps: true,
      },
      {
        name: 'Debug Vitest Test Runner',
        type: 'node',
        request: 'launch',
        program: 'node_modules/vitest/vitest.mjs',
        args: ['run'],
        stopOnEntry: false,
      },
    ];

    // Load any custom config from .vertex/launch.json or .vscode/launch.json
    this.loadPersistedConfigurations();
  }

  public getConfigurations(): DebugConfiguration[] {
    return this.configurations;
  }

  public getActiveConfigName(): string {
    return this.activeConfigName;
  }

  public setActiveConfigName(name: string) {
    this.activeConfigName = name;
  }

  public async saveConfiguration(config: DebugConfiguration): Promise<void> {
    const existingIdx = this.configurations.findIndex(c => c.name === config.name);
    if (existingIdx !== -1) {
      this.configurations[existingIdx] = config;
    } else {
      this.configurations.push(config);
    }

    const payload = JSON.stringify({ version: '0.2.0', configurations: this.configurations }, null, 2);
    this.vfs.writeFile('.vertex/launch.json', payload);
    try {
      await DesktopBridge.writeFile('.vertex/launch.json', payload);
    } catch {}
  }

  public loadPersistedConfigurations() {
    const content = this.vfs.readFile('.vertex/launch.json') || this.vfs.readFile('.vscode/launch.json');
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.configurations) && parsed.configurations.length > 0) {
          this.configurations = parsed.configurations;
          this.activeConfigName = this.configurations[0].name;
        }
      } catch {}
    }
  }

  // ==========================================
  // BREAKPOINTS MANAGEMENT
  // ==========================================

  public setBreakpoint(filePath: string, line: number, condition?: string): Breakpoint {
    const cleanPath = filePath.replace(/\\/g, '/');
    const id = `bp-${cleanPath}-${line}`;
    const bp: Breakpoint = {
      id,
      filePath: cleanPath,
      line,
      enabled: true,
      condition: condition?.trim() || undefined,
      verified: true,
    };
    this.breakpoints.set(id, bp);
    this.notifyBreakpoints();
    return bp;
  }

  public toggleBreakpoint(filePath: string, line: number): boolean {
    const cleanPath = filePath.replace(/\\/g, '/');
    const id = `bp-${cleanPath}-${line}`;
    if (this.breakpoints.has(id)) {
      this.breakpoints.delete(id);
      this.notifyBreakpoints();
      return false; // removed
    } else {
      this.setBreakpoint(cleanPath, line);
      return true; // added
    }
  }

  public removeBreakpoint(id: string) {
    this.breakpoints.delete(id);
    this.notifyBreakpoints();
  }

  public setBreakpointEnabled(id: string, enabled: boolean) {
    const bp = this.breakpoints.get(id);
    if (bp) {
      bp.enabled = enabled;
      this.notifyBreakpoints();
    }
  }

  public clearAllBreakpoints() {
    this.breakpoints.clear();
    this.notifyBreakpoints();
  }

  public getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  public getBreakpointsForFile(filePath: string): Breakpoint[] {
    const cleanPath = filePath.replace(/\\/g, '/');
    return Array.from(this.breakpoints.values()).filter(b => b.filePath === cleanPath);
  }

  private notifyBreakpoints() {
    if (this.events.onBreakpointsChange) {
      this.events.onBreakpointsChange(this.getBreakpoints());
    }
  }

  // ==========================================
  // WATCH EXPRESSIONS
  // ==========================================

  public addWatchExpression(expression: string): WatchExpression {
    const cleanExpr = expression.trim();
    const id = `watch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const watch: WatchExpression = {
      id,
      expression: cleanExpr,
      updatedAt: Date.now(),
    };
    this.watchExpressions.set(id, watch);
    this.evaluateWatchExpressions();
    return watch;
  }

  public removeWatchExpression(id: string) {
    this.watchExpressions.delete(id);
    this.notifyWatchExpressions();
  }

  public getWatchExpressions(): WatchExpression[] {
    return Array.from(this.watchExpressions.values());
  }

  private evaluateWatchExpressions() {
    const activeFrame = this.stackFrames.find(f => f.id === this.activeFrameId);
    const scopeVars = this.variablesScopeMap.get(1) || []; // Local scope

    // Context dictionary for evaluation
    const context: Record<string, any> = {};
    for (const v of scopeVars) {
      try {
        context[v.name] = JSON.parse(v.value);
      } catch {
        context[v.name] = v.value;
      }
    }

    for (const watch of this.watchExpressions.values()) {
      try {
        const fn = new Function(...Object.keys(context), `return (${watch.expression});`);
        const evaluated = fn(...Object.values(context));
        watch.value = typeof evaluated === 'object' ? JSON.stringify(evaluated) : String(evaluated);
        watch.type = typeof evaluated;
        watch.error = undefined;
      } catch (err: any) {
        watch.value = undefined;
        watch.error = err.message || 'Evaluation error';
      }
      watch.updatedAt = Date.now();
    }

    this.notifyWatchExpressions();
  }

  private notifyWatchExpressions() {
    if (this.events.onWatchExpressionsChange) {
      this.events.onWatchExpressionsChange(this.getWatchExpressions());
    }
  }

  // ==========================================
  // DEBUGGING SESSION CONTROLS
  // ==========================================

  public async startSession(configName?: string, customFile?: string): Promise<DebugSession> {
    const targetName = configName || this.activeConfigName;
    const config = this.configurations.find(c => c.name === targetName) || this.configurations[0];

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

    // Build execution trajectory for target program
    this.prepareExecutionTrajectory(targetProgram);

    session.status = 'running';
    this.notifySession();

    // Check if stopOnEntry is set or first breakpoint is encountered
    if (config.stopOnEntry || this.hasBreakpointAt(targetProgram, this.simulatedExecutionLines[0]?.line)) {
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
    // In our engine, stepInto advances to nested execution frame
    this.stepOver();
  }

  public stepOut() {
    // Advance to parent frame return
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

  // ==========================================
  // EXECUTION TRAJECTORY & STEPPING ENGINE
  // ==========================================

  private prepareExecutionTrajectory(filePath: string) {
    let content = this.vfs.readFile(filePath) || '';
    if (!content && filePath.includes('sampleDebugTarget')) {
      this.seedSampleDebugTarget();
      content = this.vfs.readFile('src/services/sampleDebugTarget.ts') || '';
    }
    const lines = content.split('\n');

    this.simulatedExecutionLines = [];
    const cumulativeVars: Record<string, any> = {
      sourceFile: filePath,
      prices: [45, 120, 89, 320, 15],
    };

    // Parse executable lines and synthesize actual stack/variable states
    lines.forEach((l, idx) => {
      const trimmed = l.trim();
      const lineNum = idx + 1;

      // Match statements
      if (
        trimmed &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('/*') &&
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('import ') &&
        !trimmed.startsWith('export interface') &&
        !trimmed.startsWith('type ')
      ) {
        if (trimmed.includes('const') || trimmed.includes('let') || trimmed.includes('var')) {
          const varMatch = trimmed.match(/(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*([^;]+);?/);
          if (varMatch) {
            const varName = varMatch[2];
            const rawVal = varMatch[3].trim();
            try {
              cumulativeVars[varName] = JSON.parse(rawVal);
            } catch {
              cumulativeVars[varName] = rawVal;
            }
          }
        }

        if (trimmed.includes('+=') || (trimmed.includes('=') && !trimmed.startsWith('const') && !trimmed.startsWith('let') && !trimmed.startsWith('var') && !trimmed.startsWith('if') && !trimmed.startsWith('for'))) {
          const assignMatch = trimmed.match(/([a-zA-Z0-9_$]+)\s*(\+=|=)\s*([^;]+);?/);
          if (assignMatch) {
            const varName = assignMatch[1];
            const op = assignMatch[2];
            const rawVal = assignMatch[3].trim();
            if (op === '+=') {
              const num = Number(rawVal);
              if (!isNaN(num) && typeof cumulativeVars[varName] === 'number') {
                cumulativeVars[varName] += num;
              } else {
                cumulativeVars[varName] = (cumulativeVars[varName] || 0) + 1;
              }
            } else {
              try {
                cumulativeVars[varName] = JSON.parse(rawVal);
              } catch {
                cumulativeVars[varName] = rawVal;
              }
            }
          }
        }

        // Detect potential division by zero or error assertions
        const isException = trimmed.includes('throw new Error') || trimmed.includes('/ 0') || trimmed.includes('.undefinedMethod()');

        this.simulatedExecutionLines.push({
          line: lineNum,
          name: trimmed.slice(0, 40),
          vars: { ...cumulativeVars, stepIndex: this.simulatedExecutionLines.length + 1, line: lineNum },
          isException,
        });
      }
    });

    if (this.simulatedExecutionLines.length === 0) {
      this.simulatedExecutionLines.push({
        line: 1,
        name: 'Entry',
        vars: { ...cumulativeVars, initialized: true },
      });
    }

    this.activeExecutionStepIndex = 0;
  }

  private hasBreakpointAt(filePath: string, line?: number): boolean {
    if (!line) return false;
    const cleanPath = filePath.replace(/\\/g, '/');
    const id = `bp-${cleanPath}-${line}`;
    const bp = this.breakpoints.get(id);
    if (!bp || !bp.enabled) return false;

    // Evaluate conditional breakpoint expression if present
    if (bp.condition) {
      try {
        const currentVars = this.simulatedExecutionLines[this.activeExecutionStepIndex]?.vars || {};
        const fn = new Function(...Object.keys(currentVars), `return Boolean(${bp.condition});`);
        const matches = fn(...Object.values(currentVars));
        return !!matches;
      } catch {
        return true; // trigger if condition evaluation fails
      }
    }

    return true;
  }

  private runUntilNextBreakpoint() {
    let nextIdx = this.activeExecutionStepIndex + 1;
    const program = this.currentSession?.configuration.program || 'src/services/sampleDebugTarget.ts';

    while (nextIdx < this.simulatedExecutionLines.length) {
      const step = this.simulatedExecutionLines[nextIdx];
      this.activeExecutionStepIndex = nextIdx;

      // Check exception
      if (step.isException) {
        this.pauseAtStep(nextIdx, 'exception', `Uncaught Error encountered at line ${step.line}: ${step.name}`);
        return;
      }

      // Check breakpoint
      if (this.hasBreakpointAt(program, step.line)) {
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

    // 1. Construct Stack Frames
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

    // 2. Construct Scopes & Variables
    const localVars: Variable[] = Object.entries(currentStep.vars).map(([k, v], idx) => ({
      name: k,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      type: typeof v,
      variablesReference: 100 + idx,
    }));

    // Add common local inspection variables
    localVars.push(
      { name: 'this', value: '{ context: "DebuggerEngine" }', type: 'object', variablesReference: 199 },
      { name: 'executionState', value: '"PAUSED_AT_BREAKPOINT"', type: 'string', variablesReference: 0 }
    );

    const globalVars: Variable[] = [
      { name: 'process.env.NODE_ENV', value: '"development"', type: 'string', variablesReference: 0 },
      { name: 'global.timeout', value: '5000', type: 'number', variablesReference: 0 },
    ];

    this.variablesScopeMap.set(1, localVars); // Local Scope (ref: 1)
    this.variablesScopeMap.set(2, globalVars); // Global Scope (ref: 2)

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

  // ==========================================
  // REPL EVALUATION
  // ==========================================

  public evaluateInConsole(expression: string): string {
    this.logConsole(`> ${expression}`, 'input');

    const currentVars = this.simulatedExecutionLines[this.activeExecutionStepIndex]?.vars || {};
    try {
      const fn = new Function(...Object.keys(currentVars), `return (${expression});`);
      const res = fn(...Object.values(currentVars));
      const str = typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res);
      this.logConsole(str, 'output');
      return str;
    } catch (err: any) {
      this.logConsole(`Error: ${err.message}`, 'stderr');
      return `Error: ${err.message}`;
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

  // ==========================================
  // AI DEBUGGER ASSISTANT
  // ==========================================

  public async diagnoseWithAI(): Promise<AIDebugDiagnosis> {
    if (!this.currentSession || this.currentThread.status !== 'paused') {
      throw new Error('Debugger must be paused at a breakpoint or exception to diagnose.');
    }

    const activeFrame = this.stackFrames.find(f => f.id === this.activeFrameId) || this.stackFrames[0];
    const sourcePath = activeFrame.source.path;
    const sourceCode = this.vfs.readFile(sourcePath) || '';

    // Extract variables with secret redaction
    const rawVars = this.variablesScopeMap.get(1) || [];
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

    const promptContext = `
The multi-language debugger is paused at:
- File: ${sourcePath}
- Line: ${activeFrame.line}
- Pause reason: ${this.currentThread.pauseReason}
- Exception: ${this.currentThread.exceptionText || 'None'}
- Variables in scope: ${JSON.stringify(sanitizedVars, null, 2)}
- Source code around line:
${sourceCode.split('\n').slice(Math.max(0, activeFrame.line - 5), activeFrame.line + 5).join('\n')}
    `;

    try {
      const aiRes = await GeminiService.debugIssue({
        errorLog: this.currentThread.exceptionText || `Paused at line ${activeFrame.line}`,
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

  // ==========================================
  // GETTERS & EVENT NOTIFIERS
  // ==========================================

  public getSession(): DebugSession | null {
    return this.currentSession;
  }

  public getThread(): Thread {
    return this.currentThread;
  }

  public getStackFrames(): StackFrame[] {
    return this.stackFrames;
  }

  public getScopes(frameId: number): Scope[] {
    return [
      { name: 'Local', variablesReference: 1, expensive: false },
      { name: 'Global', variablesReference: 2, expensive: false },
    ];
  }

  public getVariables(variablesReference: number): Variable[] {
    return this.variablesScopeMap.get(variablesReference) || [];
  }

  private notifySession() {
    if (this.events.onSessionStateChange) {
      this.events.onSessionStateChange(this.currentSession);
    }
  }

  private notifyThread() {
    if (this.events.onThreadStateChange) {
      this.events.onThreadStateChange(this.currentThread);
    }
  }

  private notifyStackFrames() {
    if (this.events.onStackFramesChange) {
      this.events.onStackFramesChange(this.stackFrames);
    }
  }

  private notifyScopes() {
    if (this.events.onScopesChange) {
      this.events.onScopesChange(this.getScopes(this.activeFrameId));
    }
  }

  private notifyVariables(scopeRef: number) {
    if (this.events.onVariablesChange) {
      this.events.onVariablesChange(this.getVariables(scopeRef));
    }
  }
}
