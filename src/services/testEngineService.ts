/**
 * Intelligent Testing, Failure Diagnosis, and Self-Repair Engine Service
 * Connects frontend UI to real test discovery, execution, AI diagnosis, and bounded self-repair.
 */

import {
  TestDiscovery,
  TestRunResult,
  TestCaseResult,
  FailureDiagnosis,
  SelfRepairResult,
  TestRunComparison,
} from '../types/testEngine';
import { logger } from './logger';

export class TestEngineService {
  private static lastRunResult: TestRunResult | null = null;
  private static workspaceCwd: string = '.';

  public static setCwd(cwd: string) {
    this.workspaceCwd = cwd;
  }

  public static getCwd(): string {
    return this.workspaceCwd || '.';
  }

  public static getLastRun(): TestRunResult | null {
    return this.lastRunResult;
  }

  // ==========================================
  // 1. TEST DISCOVERY
  // ==========================================

  public static async discoverTests(cwd?: string): Promise<TestDiscovery> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/test/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: targetCwd }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      logger.warn('[TestEngine] Discovery error:', e);
    }

    return {
      framework: 'vitest',
      scripts: [{ name: 'test', command: 'vitest run', kind: 'unit' }],
      testFiles: [],
      capabilities: {
        canRunSingleFile: true,
        canFilterByName: true,
        canRerunFailed: true,
        canTypecheck: true,
        canLint: true,
        canBuild: true,
      },
    };
  }

  // ==========================================
  // 2. TEST EXECUTION
  // ==========================================

  public static async runAll(cwd?: string, executionId?: string): Promise<TestRunResult> {
    return this.executeRun({ target: 'all', cwd, executionId });
  }

  public static async runFile(testFile: string, cwd?: string, executionId?: string): Promise<TestRunResult> {
    return this.executeRun({ target: 'file', testFile, cwd, executionId });
  }

  public static async runSelected(filter: string, cwd?: string, executionId?: string): Promise<TestRunResult> {
    return this.executeRun({ target: 'selected', filter, cwd, executionId });
  }

  public static async runFailed(failedFiles: string[], cwd?: string, executionId?: string): Promise<TestRunResult> {
    return this.executeRun({ target: 'failed', failedFiles, cwd, executionId });
  }

  public static async runTypecheck(cwd?: string, executionId?: string): Promise<TestRunResult> {
    return this.executeRun({ target: 'typecheck', cwd, executionId });
  }

  public static async runLint(cwd?: string, executionId?: string): Promise<TestRunResult> {
    return this.executeRun({ target: 'lint', cwd, executionId });
  }

  public static async runBuild(cwd?: string, executionId?: string): Promise<TestRunResult> {
    return this.executeRun({ target: 'build', cwd, executionId });
  }

  public static async cancelRun(executionId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/process/interrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private static async executeRun(params: {
    target: 'all' | 'file' | 'selected' | 'failed' | 'typecheck' | 'lint' | 'build';
    testFile?: string;
    filter?: string;
    failedFiles?: string[];
    cwd?: string;
    executionId?: string;
  }): Promise<TestRunResult> {
    const targetCwd = params.cwd || this.getCwd();
    const execId = params.executionId || `test-run-${Date.now()}`;

    try {
      const res = await fetch('/api/test/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          cwd: targetCwd,
          executionId: execId,
        }),
      });

      if (res.ok) {
        const result: TestRunResult = await res.json();
        // Compute comparison with previous run
        result.comparison = this.computeComparison(this.lastRunResult, result);
        this.lastRunResult = result;
        return result;
      }
    } catch (e) {
      logger.warn('[TestEngine] Execution error:', e);
    }

    const fallbackResult: TestRunResult = {
      runId: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      target: params.target,
      command: 'npx vitest run',
      exitCode: 1,
      durationMs: 0,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      rawOutput: 'Failed to communicate with test runner process.',
    };
    return fallbackResult;
  }

  // ==========================================
  // 3. COMPARISON UTILITY
  // ==========================================

  public static computeComparison(prev: TestRunResult | null, current: TestRunResult): TestRunComparison {
    if (!prev || !prev.tests || prev.tests.length === 0) {
      return {
        newFailures: current.tests.filter(t => t.status === 'failed').map(t => t.name),
        newPasses: current.tests.filter(t => t.status === 'passed').map(t => t.name),
        fixedTests: [],
      };
    }

    const prevFailedMap = new Map(prev.tests.filter(t => t.status === 'failed').map(t => [t.id || t.name, t]));
    const prevPassedMap = new Map(prev.tests.filter(t => t.status === 'passed').map(t => [t.id || t.name, t]));

    const newFailures: string[] = [];
    const fixedTests: string[] = [];
    const newPasses: string[] = [];

    for (const test of current.tests) {
      const key = test.id || test.name;
      if (test.status === 'failed') {
        if (!prevFailedMap.has(key)) {
          newFailures.push(test.name);
        }
      } else if (test.status === 'passed') {
        if (prevFailedMap.has(key)) {
          fixedTests.push(test.name);
        } else if (!prevPassedMap.has(key)) {
          newPasses.push(test.name);
        }
      }
    }

    return {
      newFailures,
      newPasses,
      fixedTests,
    };
  }

  // ==========================================
  // 4. FAILURE DIAGNOSIS
  // ==========================================

  public static async diagnoseFailure(params: {
    testName: string;
    filePath: string;
    errorMessage?: string;
    errorStack?: string;
    expected?: string;
    actual?: string;
    cwd?: string;
  }): Promise<FailureDiagnosis> {
    const targetCwd = params.cwd || this.getCwd();
    try {
      const res = await fetch('/api/test/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, cwd: targetCwd }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      logger.warn('[TestEngine] Failure diagnosis error:', e);
    }

    return {
      failureId: `fail-${Date.now()}`,
      testName: params.testName,
      filePath: params.filePath,
      category: 'code_defect',
      rootCause: params.errorMessage || 'Assertion failure occurred during execution.',
      associatedSourceFiles: [],
      associatedTestFiles: [params.filePath],
      proposedFix: {
        targetFile: params.filePath,
        explanation: 'Review assertion values.',
        patch: '',
        confidence: 0.5,
      },
      verificationCommand: `npx vitest run "${params.filePath}"`,
    };
  }

  // ==========================================
  // 5. BOUNDED SELF-REPAIR
  // ==========================================

  public static async selfRepair(diagnosis: FailureDiagnosis, cwd?: string): Promise<SelfRepairResult> {
    const targetCwd = cwd || this.getCwd();
    try {
      const res = await fetch('/api/test/self-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosis, cwd: targetCwd }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      logger.warn('[TestEngine] Self-repair error:', e);
    }

    return {
      success: false,
      failureId: diagnosis.failureId,
      attempts: 1,
      maxAttempts: 3,
      modifiedFiles: [],
      diff: '',
      retestPassed: false,
      suitePassed: false,
      message: 'Failed to communicate with self-repair engine.',
      auditTrail: [
        {
          timestamp: new Date().toLocaleTimeString(),
          action: 'Self-repair execution',
          outcome: 'Error reaching server self-repair API',
        },
      ],
    };
  }
}
