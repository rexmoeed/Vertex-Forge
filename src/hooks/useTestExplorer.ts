import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TestDiscovery,
  TestRunResult,
  TestCaseResult,
  FailureDiagnosis,
  SelfRepairResult,
} from '../types/testEngine';
import { TestEngineService } from '../services/testEngineService';
import { useIDE } from '../context/IDEContext';

export function useTestExplorer() {
  const { logAgentAction, refreshGit } = useIDE();

  // Test Discovery state
  const [discovery, setDiscovery] = useState<TestDiscovery | null>(null);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  // Test Run state
  const [runResult, setRunResult] = useState<TestRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTaskTarget, setActiveTaskTarget] = useState<string | null>(null);
  const executionIdRef = useRef<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'failed' | 'passed' | 'skipped'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [activeWorkspaceCwd, setActiveWorkspaceCwd] = useState<string>('.');

  // Expanded folders/files
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Diagnosis & Self-Repair state
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<FailureDiagnosis | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<SelfRepairResult | null>(null);

  const loadDiscovery = useCallback(async (cwd?: string) => {
    setLoadingDiscovery(true);
    try {
      const disc = await TestEngineService.discoverTests(cwd);
      setDiscovery(disc);
      const expands: Record<string, boolean> = {};
      disc.testFiles.forEach(f => {
        expands[f.path] = true;
      });
      setExpandedFiles(expands);
    } finally {
      setLoadingDiscovery(false);
    }
  }, []);

  useEffect(() => {
    loadDiscovery(activeWorkspaceCwd);
  }, [loadDiscovery, activeWorkspaceCwd]);

  const handleRun = async (
    target: 'all' | 'file' | 'selected' | 'failed' | 'typecheck' | 'lint' | 'build',
    param?: string
  ) => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveTaskTarget(target);
    const execId = `test-exec-${Date.now()}`;
    executionIdRef.current = execId;
    logAgentAction?.('Testing', `Running ${target} test suite...`, 'info');

    try {
      let res: TestRunResult;
      if (target === 'all') {
        res = await TestEngineService.runAll(activeWorkspaceCwd, execId);
      } else if (target === 'file' && param) {
        res = await TestEngineService.runFile(param, activeWorkspaceCwd, execId);
      } else if (target === 'selected' && param) {
        res = await TestEngineService.runSelected(param, activeWorkspaceCwd, execId);
      } else if (target === 'failed') {
        const failedFiles = Array.from(
          new Set((runResult?.tests || []).filter(t => t.status === 'failed').map(t => t.filePath))
        );
        res = await TestEngineService.runFailed(failedFiles, activeWorkspaceCwd, execId);
      } else if (target === 'typecheck') {
        res = await TestEngineService.runTypecheck(activeWorkspaceCwd, execId);
      } else if (target === 'lint') {
        res = await TestEngineService.runLint(activeWorkspaceCwd, execId);
      } else if (target === 'build') {
        res = await TestEngineService.runBuild(activeWorkspaceCwd, execId);
      } else {
        res = await TestEngineService.runAll(activeWorkspaceCwd, execId);
      }

      setRunResult(res);

      const firstFail = res.tests.find(t => t.status === 'failed');
      if (firstFail) {
        setSelectedTestCase(firstFail);
      }

      logAgentAction?.(
        'Testing',
        `Test execution completed: ${res.passed} passed, ${res.failed} failed (${res.durationMs}ms)`,
        res.failed === 0 ? 'success' : 'error'
      );
    } finally {
      setIsRunning(false);
      setActiveTaskTarget(null);
      executionIdRef.current = null;
    }
  };

  const handleCancel = async () => {
    if (executionIdRef.current) {
      await TestEngineService.cancelRun(executionIdRef.current);
      setIsRunning(false);
      setActiveTaskTarget(null);
      logAgentAction?.('Testing', 'Cancelled running test execution.', 'warning');
    }
  };

  const handleDiagnose = async (testCase: TestCaseResult) => {
    setSelectedTestCase(testCase);
    setIsDiagnosing(true);
    setDiagnosis(null);
    setRepairResult(null);
    try {
      const diag = await TestEngineService.diagnoseFailure({
        testName: testCase.name,
        filePath: testCase.filePath,
        errorMessage: testCase.errorMessage,
        errorStack: testCase.errorStack,
        expected: testCase.expected,
        actual: testCase.actual,
        cwd: activeWorkspaceCwd,
      });
      setDiagnosis(diag);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSelfRepair = async () => {
    if (!diagnosis) return;
    setIsRepairing(true);
    try {
      const result = await TestEngineService.selfRepair(diagnosis, activeWorkspaceCwd);
      setRepairResult(result);
      if (result.success) {
        logAgentAction?.(
          'Debugger',
          `Self-repair succeeded for ${diagnosis.testName}. Verified with re-test.`,
          'success'
        );
        await refreshGit?.();
        await handleRun('file', diagnosis.filePath);
      } else {
        logAgentAction?.('Debugger', `Self-repair attempt could not resolve failure: ${result.message}`, 'error');
      }
    } finally {
      setIsRepairing(false);
    }
  };

  const toggleFile = (filePath: string) => {
    setExpandedFiles(prev => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  return {
    discovery,
    loadingDiscovery,
    runResult,
    isRunning,
    activeTaskTarget,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    activeWorkspaceCwd,
    setActiveWorkspaceCwd,
    expandedFiles,
    selectedTestCase,
    setSelectedTestCase,
    diagnosis,
    isDiagnosing,
    isRepairing,
    repairResult,
    loadDiscovery,
    handleRun,
    handleCancel,
    handleDiagnose,
    handleSelfRepair,
    toggleFile,
  };
}
