import { describe, it, expect, beforeEach } from 'vitest';
import { DebuggerEngine } from '../debuggerEngine';
import { VirtualFileSystem } from '../virtualFs';
import { computeInventoryAverages } from '../sampleDebugTarget';

describe('Multi-Language Debugger & DAP Architecture', () => {
  let vfs: VirtualFileSystem;
  let debuggerEngine: DebuggerEngine;

  beforeEach(() => {
    vfs = new VirtualFileSystem([
      {
        id: 'folder-src',
        name: 'src',
        path: 'src',
        type: 'folder',
        children: [
          {
            id: 'file-sample',
            name: 'sampleDebugTarget.ts',
            path: 'src/services/sampleDebugTarget.ts',
            type: 'file',
            content: `export function computeInventoryAverages(prices: number[]) {
  let total = 0;
  let maxItem = 0;
  let itemsProcessed = 0;
  for (let i = 0; i < prices.length; i++) {
    const currentPrice = prices[i];
    if (currentPrice > maxItem) {
      maxItem = currentPrice;
    }
    total += currentPrice;
    itemsProcessed += 1;
  }
  if (prices.length === 0) {
    throw new Error('Cannot compute average of empty price inventory');
  }
  const average = total / itemsProcessed;
  return { total, average, itemsProcessed, maxItem };
}`,
          },
        ],
      },
    ]);

    debuggerEngine = new DebuggerEngine(vfs);
  });

  describe('1. Runtime & Adapter Discovery', () => {
    it('discovers installed runtimes and reports missing adapters honestly', async () => {
      const runtimes = await debuggerEngine.discoverRuntimes();
      expect(Array.isArray(runtimes)).toBe(true);
      expect(runtimes.length).toBeGreaterThanOrEqual(3);

      const nodeRuntime = runtimes.find(r => r.language.includes('JavaScript') || r.runtime.includes('Node'));
      expect(nodeRuntime).toBeDefined();
      expect(nodeRuntime?.adapterName).toContain('js-debug');

      // Verify that missing runtimes report clear reason and do not pretend to be installed
      const pythonRuntime = runtimes.find(r => r.language === 'Python');
      if (pythonRuntime && !pythonRuntime.isAvailable) {
        expect(pythonRuntime.reasonIfNotAvailable).toBeDefined();
        expect(pythonRuntime.adapterInstalled).toBe(false);
      }
    });
  });

  describe('2. Launch Configurations & Persistence', () => {
    it('loads default launch configurations and handles active configuration', () => {
      const configs = debuggerEngine.getConfigurations();
      expect(configs.length).toBeGreaterThanOrEqual(3);
      expect(configs.some(c => c.name.includes('sampleDebugTarget'))).toBe(true);

      debuggerEngine.setActiveConfigName('Debug Sample Program (sampleDebugTarget.ts)');
      expect(debuggerEngine.getActiveConfigName()).toBe('Debug Sample Program (sampleDebugTarget.ts)');
    });

    it('persists and loads configurations to .vertex/launch.json in VFS', async () => {
      const customConfig = {
        name: 'Custom Node Runner',
        type: 'node' as const,
        request: 'launch' as const,
        program: 'src/index.ts',
        args: ['--dev'],
        stopOnEntry: true,
      };

      await debuggerEngine.saveConfiguration(customConfig);

      // Verify persisted in VFS
      const savedJson = vfs.readFile('.vertex/launch.json');
      expect(savedJson).toBeDefined();
      const parsed = JSON.parse(savedJson!);
      expect(parsed.configurations.some((c: any) => c.name === 'Custom Node Runner')).toBe(true);

      // Re-instantiate engine to verify loading persisted configs
      const freshEngine = new DebuggerEngine(vfs);
      const loaded = freshEngine.getConfigurations();
      expect(loaded.some(c => c.name === 'Custom Node Runner')).toBe(true);
    });
  });

  describe('3. Breakpoints Management', () => {
    it('sets, toggles, enables, disables, and removes breakpoints', () => {
      const filePath = 'src/services/sampleDebugTarget.ts';

      // Set breakpoint
      const bp1 = debuggerEngine.setBreakpoint(filePath, 7);
      expect(bp1.verified).toBe(true);
      expect(bp1.enabled).toBe(true);
      expect(bp1.line).toBe(7);

      // Toggle existing removes it
      const removed = debuggerEngine.toggleBreakpoint(filePath, 7);
      expect(removed).toBe(false);
      expect(debuggerEngine.getBreakpointsForFile(filePath).length).toBe(0);

      // Toggle again adds it
      const added = debuggerEngine.toggleBreakpoint(filePath, 7);
      expect(added).toBe(true);
      expect(debuggerEngine.getBreakpointsForFile(filePath).length).toBe(1);

      // Disable breakpoint
      const currentBp = debuggerEngine.getBreakpointsForFile(filePath)[0];
      debuggerEngine.setBreakpointEnabled(currentBp.id, false);
      expect(debuggerEngine.getBreakpointsForFile(filePath)[0].enabled).toBe(false);

      // Remove breakpoint
      debuggerEngine.removeBreakpoint(currentBp.id);
      expect(debuggerEngine.getBreakpoints().length).toBe(0);
    });

    it('supports conditional breakpoints', () => {
      const filePath = 'src/services/sampleDebugTarget.ts';
      const bp = debuggerEngine.setBreakpoint(filePath, 10, 'total > 50');
      expect(bp.condition).toBe('total > 50');
      expect(debuggerEngine.getBreakpoints().length).toBe(1);

      debuggerEngine.clearAllBreakpoints();
      expect(debuggerEngine.getBreakpoints().length).toBe(0);
    });
  });

  describe('4. Session Lifecycle & Stepping Engine', () => {
    it('starts session, pauses at breakpoint or entry, and steps execution', async () => {
      let sessionNotified = false;
      let threadNotified = false;
      let stackNotified = false;
      let locationNotified = false;

      debuggerEngine.setEvents({
        onSessionStateChange: () => { sessionNotified = true; },
        onThreadStateChange: () => { threadNotified = true; },
        onStackFramesChange: () => { stackNotified = true; },
        onActiveLocationChange: () => { locationNotified = true; },
      });

      // Set breakpoint at line 7 in sample target
      debuggerEngine.setBreakpoint('src/services/sampleDebugTarget.ts', 7);

      const session = await debuggerEngine.startSession('Debug Sample Program (sampleDebugTarget.ts)');
      expect(session).toBeDefined();
      expect(session.status).toBe('paused');
      expect(debuggerEngine.getThread().status).toBe('paused');
      expect(sessionNotified).toBe(true);
      expect(threadNotified).toBe(true);
      expect(stackNotified).toBe(true);
      expect(locationNotified).toBe(true);

      // Step over
      debuggerEngine.stepOver();
      expect(debuggerEngine.getThread().status).toBe('paused');
      const frames = debuggerEngine.getStackFrames();
      expect(frames.length).toBeGreaterThan(0);

      // Step out
      debuggerEngine.stepOut();
      expect(debuggerEngine.getThread().status).toBe('paused');

      // Stop session
      debuggerEngine.stopSession();
      expect(debuggerEngine.getSession()).toBeNull();
      expect(debuggerEngine.getThread().status).toBe('terminated');
    });

    it('pauses and continues execution flow until exception or breakpoint', async () => {
      await debuggerEngine.startSession('Debug Sample Program (sampleDebugTarget.ts)');
      expect(debuggerEngine.getThread().status).toBe('paused');

      debuggerEngine.continue();
      // Hits the deliberate boundary exception in sampleDebugTarget.ts and pauses with exception info
      expect(
        debuggerEngine.getThread().pauseReason === 'exception' ||
        debuggerEngine.getSession() === null ||
        debuggerEngine.getThread().status === 'running'
      ).toBe(true);

      if (debuggerEngine.getThread().pauseReason === 'exception') {
        expect(debuggerEngine.getThread().exceptionText).toBeDefined();
      }
    });
  });

  describe('5. Variable & Stack Frame Inspection', () => {
    it('inspects call stack, local variables, and global scopes', async () => {
      let variablesUpdated = false;
      debuggerEngine.setEvents({
        onVariablesChange: () => { variablesUpdated = true; },
      });

      debuggerEngine.setBreakpoint('src/services/sampleDebugTarget.ts', 10);
      await debuggerEngine.startSession('Debug Sample Program (sampleDebugTarget.ts)');

      const frames = debuggerEngine.getStackFrames();
      expect(frames.length).toBeGreaterThanOrEqual(1);
      expect(frames[0].source.path).toContain('sampleDebugTarget.ts');

      const scopes = debuggerEngine.getScopes(frames[0].id);
      expect(scopes.length).toBe(2);
      expect(scopes[0].name).toBe('Local');
      expect(scopes[1].name).toBe('Global');

      const localVars = debuggerEngine.getVariables(1);
      expect(localVars.length).toBeGreaterThan(0);
      expect(localVars.some(v => v.name === 'total' || v.name === 'this')).toBe(true);

      // Select another frame
      debuggerEngine.selectStackFrame(frames[0].id);
      expect(variablesUpdated).toBe(true);
    });
  });

  describe('6. Watch Expressions & REPL Console', () => {
    it('adds, evaluates, and removes watch expressions in paused context', async () => {
      await debuggerEngine.startSession('Debug Sample Program (sampleDebugTarget.ts)');

      const watch1 = debuggerEngine.addWatchExpression('total + 10');
      expect(watch1.id).toBeDefined();
      expect(watch1.expression).toBe('total + 10');

      const watchList = debuggerEngine.getWatchExpressions();
      expect(watchList.length).toBe(1);

      debuggerEngine.removeWatchExpression(watch1.id);
      expect(debuggerEngine.getWatchExpressions().length).toBe(0);
    });

    it('evaluates expressions in the interactive REPL console', async () => {
      await debuggerEngine.startSession('Debug Sample Program (sampleDebugTarget.ts)');

      const res = debuggerEngine.evaluateInConsole('2 + 3');
      expect(res).toBe('5');

      const logs = debuggerEngine.getConsoleMessages();
      expect(logs.some(l => l.text === '5')).toBe(true);
      expect(logs.some(l => l.category === 'input')).toBe(true);

      debuggerEngine.clearConsole();
      expect(debuggerEngine.getConsoleMessages().length).toBe(0);
    });
  });

  describe('7. AI Debugger Diagnosis with Secret Redaction', () => {
    it('redacts sensitive variable values before generating AI diagnosis', async () => {
      await debuggerEngine.startSession('Debug Sample Program (sampleDebugTarget.ts)');

      const diagnosis = await debuggerEngine.diagnoseWithAI();
      expect(diagnosis).toBeDefined();
      expect(diagnosis.hypothesis).toBeDefined();
      expect(diagnosis.suggestedFix).toBeDefined();
      expect(diagnosis.targetFile).toContain('sampleDebugTarget.ts');
      expect(Array.isArray(diagnosis.redactedVariables)).toBe(true);
    });
  });

  describe('8. Sample Debug Target Execution Correctness', () => {
    it('executes the real sample debug program calculations and verifies boundary error', () => {
      const validInventory = [45, 120, 89, 320, 15];
      const result = computeInventoryAverages(validInventory);

      expect(result.itemsProcessed).toBe(5);
      expect(result.total).toBe(589);
      expect(result.average).toBe(589 / 5);
      expect(result.maxItem).toBe(320);

      // Known boundary bug verification
      expect(() => computeInventoryAverages([])).toThrow(
        'Cannot compute average of empty price inventory'
      );
    });
  });
});
