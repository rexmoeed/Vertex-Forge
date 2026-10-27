import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTestExplorer } from '../useTestExplorer';

vi.mock('../../context/IDEContext', () => ({
  useIDE: () => ({
    openFile: vi.fn(),
    logAgentAction: vi.fn(),
    refreshGit: vi.fn(),
  }),
}));

vi.mock('../../services/testEngineService', () => ({
  TestEngineService: {
    discoverTests: vi.fn(async () => ({
      framework: 'Vitest',
      testFiles: [{ path: 'src/services/__tests__/sample.test.ts', testCount: 2 }],
      totalTests: 2,
    })),
    runAll: vi.fn(async () => ({
      passed: 2,
      failed: 0,
      skipped: 0,
      durationMs: 120,
      tests: [
        { id: 't1', name: 'unit test 1', filePath: 'src/services/__tests__/sample.test.ts', status: 'passed', durationMs: 20 },
        { id: 't2', name: 'unit test 2', filePath: 'src/services/__tests__/sample.test.ts', status: 'passed', durationMs: 25 },
      ],
      rawOutput: 'All tests passed',
    })),
    runFile: vi.fn(async (file: string) => ({
      passed: 1,
      failed: 0,
      skipped: 0,
      durationMs: 40,
      tests: [{ id: 't1', name: 'unit test 1', filePath: file, status: 'passed', durationMs: 20 }],
      rawOutput: 'File test passed',
    })),
    diagnoseFailure: vi.fn(async () => ({
      category: 'assertion_mismatch',
      rootCause: 'Expected 10 but received 20',
      proposedFix: { targetFile: 'src/calc.ts', explanation: 'Update return value', patch: 'return 10;', confidence: 0.95 },
    })),
    selfRepair: vi.fn(async () => ({
      success: true,
      message: 'Repaired successfully',
      auditTrail: [{ action: 'patch', outcome: 'applied', timestamp: '12:00:00' }],
    })),
    cancelRun: vi.fn(async () => {}),
  },
}));

describe('useTestExplorer hook', () => {
  it('discovers tests on mount', async () => {
    const { result } = renderHook(() => useTestExplorer());

    // Wait for discovery
    await vi.waitFor(() => {
      expect(result.current.discovery?.framework).toBe('Vitest');
      expect(result.current.expandedFiles['src/services/__tests__/sample.test.ts']).toBe(true);
    });
  });

  it('runs tests and toggles expansion', async () => {
    const { result } = renderHook(() => useTestExplorer());

    await act(async () => {
      await result.current.handleRun('all');
    });

    expect(result.current.runResult?.passed).toBe(2);
    expect(result.current.runResult?.failed).toBe(0);

    act(() => {
      result.current.toggleFile('src/services/__tests__/sample.test.ts');
    });

    expect(result.current.expandedFiles['src/services/__tests__/sample.test.ts']).toBe(false);
  });
});
