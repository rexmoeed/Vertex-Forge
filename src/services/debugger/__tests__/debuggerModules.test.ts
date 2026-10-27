import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualFileSystem } from '../../virtualFs';
import { DebuggerBreakpointsManager } from '../debuggerBreakpoints';
import { DebuggerWatchManager } from '../debuggerWatch';
import { DebuggerConfigManager } from '../debuggerConfig';
import { prepareExecutionTrajectory } from '../debuggerTrajectory';
import { discoverAvailableRuntimes } from '../debuggerRuntimes';

describe('Debugger Modular Architecture', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem([]);
  });

  describe('DebuggerBreakpointsManager', () => {
    it('manages breakpoints and triggers change events', () => {
      let notifiedCount = 0;
      const mgr = new DebuggerBreakpointsManager(() => {
        notifiedCount++;
      });

      const bp = mgr.setBreakpoint('src/main.ts', 12);
      expect(bp.line).toBe(12);
      expect(mgr.getBreakpoints().length).toBe(1);
      expect(notifiedCount).toBe(1);

      expect(mgr.hasBreakpointAt('src/main.ts', 12)).toBe(true);
      expect(mgr.hasBreakpointAt('src/main.ts', 15)).toBe(false);

      const toggledOff = mgr.toggleBreakpoint('src/main.ts', 12);
      expect(toggledOff).toBe(false);
      expect(mgr.getBreakpoints().length).toBe(0);
    });

    it('evaluates conditional breakpoints properly', () => {
      const mgr = new DebuggerBreakpointsManager();
      mgr.setBreakpoint('src/main.ts', 10, 'count > 5');

      expect(mgr.hasBreakpointAt('src/main.ts', 10, { count: 10 })).toBe(true);
      expect(mgr.hasBreakpointAt('src/main.ts', 10, { count: 2 })).toBe(false);
    });
  });

  describe('DebuggerWatchManager', () => {
    it('evaluates watch expressions against current scope variables', () => {
      const mgr = new DebuggerWatchManager();
      mgr.addWatchExpression('total + 5');

      mgr.evaluate([
        { name: 'total', value: '10', type: 'number', variablesReference: 1 },
      ]);

      const watches = mgr.getWatchExpressions();
      expect(watches.length).toBe(1);
      expect(watches[0].value).toBe('15');
    });
  });

  describe('DebuggerConfigManager', () => {
    it('loads defaults and persists launch configurations', async () => {
      const mgr = new DebuggerConfigManager(vfs);
      const initialConfigs = mgr.getConfigurations();
      expect(initialConfigs.length).toBeGreaterThan(0);

      await mgr.saveConfiguration({
        name: 'Custom Node Runner',
        type: 'node',
        request: 'launch',
        program: 'src/index.ts',
      });

      expect(mgr.getConfigurationByName('Custom Node Runner').program).toBe('src/index.ts');
    });
  });

  describe('prepareExecutionTrajectory', () => {
    it('synthesizes executable lines from source file', () => {
      vfs.writeFile('src/test.ts', 'const a = 10;\nlet b = 20;\nb += 5;\n');
      const trajectory = prepareExecutionTrajectory('src/test.ts', vfs);
      expect(trajectory.length).toBeGreaterThan(0);
      expect(trajectory[0].line).toBe(1);
    });
  });

  describe('discoverAvailableRuntimes', () => {
    it('discovers runtime capabilities without throwing', async () => {
      const capabilities = await discoverAvailableRuntimes();
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.some(c => c.language.includes('TypeScript') || c.language.includes('JavaScript'))).toBe(true);
    });
  });
});
