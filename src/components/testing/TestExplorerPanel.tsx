import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileCode,
  Terminal as TerminalIcon,
  Filter,
  Search,
  AlertTriangle,
  Wrench,
  Check,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  StopCircle,
  FileCheck,
  Layers,
  ArrowRight,
  Shield,
  Folder,
  ExternalLink,
  Code2,
  Zap,
} from 'lucide-react';
import {
  TestDiscovery,
  TestRunResult,
  TestCaseResult,
  FailureDiagnosis,
  SelfRepairResult,
} from '../../types/testEngine';
import { TestEngineService } from '../../services/testEngineService';
import { useIDE } from '../../context/IDEContext';

interface TestExplorerPanelProps {
  embedded?: boolean; // embedded in bottom panel vs full sidebar view
}

export const TestExplorerPanel: React.FC<TestExplorerPanelProps> = ({ embedded = false }) => {
  const { openFile, activeFile, logAgentAction, refreshGit } = useIDE();

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

  // Load discovery on mount or cwd change
  const loadDiscovery = useCallback(async (cwd?: string) => {
    setLoadingDiscovery(true);
    try {
      const disc = await TestEngineService.discoverTests(cwd);
      setDiscovery(disc);
      // Auto-expand all discovered files
      const expands: Record<string, boolean> = {};
      disc.testFiles.forEach(f => { expands[f.path] = true; });
      setExpandedFiles(expands);
    } finally {
      setLoadingDiscovery(false);
    }
  }, []);

  useEffect(() => {
    loadDiscovery(activeWorkspaceCwd);
  }, [loadDiscovery, activeWorkspaceCwd]);

  // Execute test action
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
        const failedFiles = Array.from(new Set(
          (runResult?.tests || []).filter(t => t.status === 'failed').map(t => t.filePath)
        ));
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

      // Auto-select first failing test if any
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

  // Cancel execution
  const handleCancel = async () => {
    if (executionIdRef.current) {
      await TestEngineService.cancelRun(executionIdRef.current);
      setIsRunning(false);
      setActiveTaskTarget(null);
      logAgentAction?.('Testing', 'Cancelled running test execution.', 'warning');
    }
  };

  // Diagnose Failure
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

  // Self-Repair
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
        // Refresh git and rerun tests to confirm!
        await refreshGit?.();
        await handleRun('file', diagnosis.filePath);
      } else {
        logAgentAction?.('Debugger', `Self-repair attempt could not resolve failure: ${result.message}`, 'error');
      }
    } finally {
      setIsRepairing(false);
    }
  };

  // Group tests by file
  const filteredTests = (runResult?.tests || []).filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.filePath.toLowerCase().includes(q) ||
        (t.errorMessage && t.errorMessage.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const testsByFile: Record<string, TestCaseResult[]> = {};
  filteredTests.forEach(t => {
    if (!testsByFile[t.filePath]) testsByFile[t.filePath] = [];
    testsByFile[t.filePath].push(t);
  });

  const toggleFile = (filePath: string) => {
    setExpandedFiles(prev => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  const handleOpenSourceLocation = (loc?: { filePath: string; line: number }) => {
    if (!loc) return;
    openFile?.(loc.filePath);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-slate-200 select-none font-sans overflow-hidden ${embedded ? '' : 'p-3 gap-3'}`}>
      {/* 1. TOP TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Test & Repair Engine</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                {discovery?.framework || 'Vitest'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Automated failure diagnosis & bounded self-repair
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isRunning ? (
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow animate-pulse"
              title="Cancel Running Task"
            >
              <StopCircle className="w-3.5 h-3.5" /> Stop
            </button>
          ) : (
            <button
              onClick={() => handleRun('all')}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow transition-colors"
              title="Run All Tests"
            >
              <Play className="w-3.5 h-3.5" /> Run All
            </button>
          )}

          {runResult && runResult.failed > 0 && !isRunning && (
            <button
              onClick={() => handleRun('failed')}
              className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Rerun Failed Tests Only"
            >
              <RotateCcw className="w-3 h-3" /> Failed ({runResult.failed})
            </button>
          )}

          {/* Typecheck & Lint shortcuts */}
          <button
            onClick={() => handleRun('typecheck')}
            disabled={isRunning}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors"
            title="Run TypeScript Type Checks"
          >
            <Shield className="w-3 h-3 text-cyan-400" /> Typecheck
          </button>

          <button
            onClick={() => handleRun('lint')}
            disabled={isRunning}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors"
            title="Run Linting Analysis"
          >
            <FileCheck className="w-3 h-3 text-emerald-400" /> Lint
          </button>

          <button
            onClick={() => handleRun('build')}
            disabled={isRunning}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors"
            title="Run Production Build"
          >
            <Layers className="w-3 h-3 text-amber-400" /> Build
          </button>

          <button
            onClick={() => loadDiscovery(activeWorkspaceCwd)}
            disabled={loadingDiscovery}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Refresh Test Discovery"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDiscovery ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target Workspace Selector */}
      <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Target:</span>
          <span className="text-xs text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            Active Workspace
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              viewMode === 'tree' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Explorer
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              viewMode === 'raw' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Terminal Output
          </button>
        </div>
      </div>

      {/* 2. RESULTS SUMMARY BAR */}
      {runResult && (
        <div className="px-3 py-2 border-b border-slate-800 bg-slate-850/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 text-xs">
            {/* Status Indicator */}
            <div className="flex items-center gap-1 font-semibold">
              {runResult.failed === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Passed
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {runResult.failed} Failed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">{runResult.passed} passed</span>
              <span>•</span>
              <span className="text-rose-400 font-bold">{runResult.failed} failed</span>
              {runResult.skipped > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400">{runResult.skipped} skipped</span>
                </>
              )}
              <span>•</span>
              <span className="flex items-center gap-0.5 text-slate-400">
                <Clock className="w-3 h-3" /> {runResult.durationMs}ms
              </span>
            </div>
          </div>

          {/* Comparison with previous run */}
          {runResult.comparison && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              {runResult.comparison.fixedTests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  +{runResult.comparison.fixedTests.length} fixed
                </span>
              )}
              {runResult.comparison.newFailures.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  +{runResult.comparison.newFailures.length} new failure
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. MAIN BODY: Explorer vs Raw Terminal Output */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {viewMode === 'raw' ? (
          <div className="flex-1 p-3 bg-slate-950 font-mono text-xs text-slate-300 overflow-auto whitespace-pre leading-relaxed select-text">
            {runResult?.rawOutput || 'No test execution output recorded yet. Click "Run All" above.'}
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Column: Test Suite Tree / List */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 overflow-hidden">
              {/* Filter and Search Bar */}
              <div className="p-2 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Filter test cases..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded pl-7 pr-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center rounded bg-slate-800 p-0.5 border border-slate-700 text-[10px]">
                  {(['all', 'failed', 'passed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-2 py-0.5 rounded capitalize transition-colors ${
                        statusFilter === f ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tests Tree */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                {!runResult && (
                  <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <FlaskIcon className="w-8 h-8 text-slate-600" />
                    <span className="text-xs">No active test results.</span>
                    <button
                      onClick={() => handleRun('all')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5 mt-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Execute Test Discovery Run
                    </button>
                  </div>
                )}

                {Object.entries(testsByFile).map(([filePath, tests]) => {
                  const hasFailure = tests.some(t => t.status === 'failed');
                  const isExpanded = expandedFiles[filePath] !== false;

                  return (
                    <div
                      key={filePath}
                      className="flex flex-col rounded-lg bg-slate-800/40 border border-slate-700/60 overflow-hidden"
                    >
                      {/* File Header */}
                      <div className="p-2 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors">
                        <button
                          onClick={() => toggleFile(filePath)}
                          className="flex items-center gap-1.5 font-mono text-xs truncate flex-1 text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span
                            onClick={e => {
                              e.stopPropagation();
                              openFile?.(filePath);
                            }}
                            className="text-slate-200 hover:text-indigo-300 hover:underline truncate"
                            title="Open test file in editor"
                          >
                            {filePath}
                          </span>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            hasFailure ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {tests.filter(t => t.status === 'passed').length}/{tests.length}
                          </span>

                          <button
                            onClick={() => handleRun('file', filePath)}
                            className="p-1 hover:bg-indigo-600 text-slate-400 hover:text-white rounded transition-colors"
                            title={`Run tests in ${filePath}`}
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* File Test Cases */}
                      {isExpanded && (
                        <div className="flex flex-col divide-y divide-slate-800/50">
                          {tests.map(test => (
                            <div
                              key={test.id}
                              onClick={() => setSelectedTestCase(test)}
                              className={`p-2 flex items-start justify-between gap-2 text-xs cursor-pointer transition-colors ${
                                selectedTestCase?.id === test.id
                                  ? 'bg-indigo-600/20 border-l-2 border-indigo-500'
                                  : test.status === 'failed'
                                  ? 'bg-rose-950/20 hover:bg-rose-950/30'
                                  : 'hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex items-start gap-1.5 min-w-0">
                                {test.status === 'passed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                )}
                                <div className="truncate">
                                  <div className="text-[11px] text-slate-200 font-medium leading-tight truncate">
                                    {test.name}
                                  </div>
                                  {test.errorMessage && (
                                    <div className="text-[10px] text-rose-300 font-mono truncate mt-0.5">
                                      {test.errorMessage}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono shrink-0">
                                <span>{test.durationMs}ms</span>
                                {test.status === 'failed' && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDiagnose(test);
                                    }}
                                    className="p-1 hover:bg-rose-600 text-rose-300 hover:text-white rounded transition-colors"
                                    title="Diagnose & Repair"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column / Inspector: Test Failure Diagnosis & Self-Repair Panel */}
            <div className="w-full md:w-[420px] bg-slate-950/70 p-3 flex flex-col gap-3 overflow-y-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-800">
              {selectedTestCase ? (
                <div className="flex flex-col gap-3 text-xs">
                  {/* Test Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          selectedTestCase.status === 'passed' ? 'bg-emerald-400' : 'bg-rose-500'
                        }`} />
                        <span className="font-bold text-white text-xs truncate">
                          {selectedTestCase.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {selectedTestCase.filePath}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRun('file', selectedTestCase.filePath)}
                      className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] flex items-center gap-1 px-2"
                    >
                      <Play className="w-3 h-3" /> Rerun
                    </button>
                  </div>

                  {/* Failure Details Card */}
                  {selectedTestCase.status === 'failed' && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Assertion Failure</span>
                        </div>
                        {selectedTestCase.location && (
                          <button
                            onClick={() => handleOpenSourceLocation(selectedTestCase.location)}
                            className="text-[10px] text-rose-300 hover:underline font-mono flex items-center gap-1"
                          >
                            <span>Line {selectedTestCase.location.line}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {selectedTestCase.errorMessage && (
                        <div className="text-[11px] font-mono text-rose-200 bg-rose-950/60 p-2 rounded border border-rose-800/40">
                          {selectedTestCase.errorMessage}
                        </div>
                      )}

                      {/* Stack Trace */}
                      {selectedTestCase.errorStack && (
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded max-h-36 overflow-y-auto whitespace-pre leading-relaxed">
                          {selectedTestCase.errorStack}
                        </div>
                      )}

                      {/* Action to Diagnose with AI */}
                      <button
                        onClick={() => handleDiagnose(selectedTestCase)}
                        disabled={isDiagnosing}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isDiagnosing ? 'animate-spin' : ''}`} />
                        <span>{isDiagnosing ? 'Diagnosing with AI...' : 'Diagnose Failure with AI'}</span>
                      </button>
                    </div>
                  )}

                  {/* AI Failure Diagnosis Card */}
                  {diagnosis && (
                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-lg flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>AI Failure Diagnosis</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 uppercase">
                          {diagnosis.category.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Root cause */}
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Root Cause</span>
                        <p className="text-[11px] text-slate-200 mt-0.5 leading-relaxed font-sans">
                          {diagnosis.rootCause}
                        </p>
                      </div>

                      {/* Proposed Fix */}
                      {diagnosis.proposedFix && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                            <span>Proposed Patch ({diagnosis.proposedFix.targetFile})</span>
                            <span className="text-emerald-400 font-mono">
                              {Math.round(diagnosis.proposedFix.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 italic">
                            {diagnosis.proposedFix.explanation}
                          </p>
                          <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-300 whitespace-pre overflow-x-auto border border-slate-800">
                            {diagnosis.proposedFix.patch || 'Unified replacement code prepared.'}
                          </div>
                        </div>
                      )}

                      {/* Regression test preview */}
                      {diagnosis.regressionTest && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Regression Test Guard
                          </span>
                          <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-emerald-300/90 whitespace-pre overflow-x-auto border border-slate-800">
                            {diagnosis.regressionTest.testCode}
                          </div>
                        </div>
                      )}

                      {/* Self-Repair Button */}
                      <button
                        onClick={handleSelfRepair}
                        disabled={isRepairing}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                        <span>{isRepairing ? 'Applying Patch & Verifying...' : 'Apply Self-Repair & Verify'}</span>
                      </button>
                    </div>
                  )}

                  {/* Self-Repair Outcome / Audit Trail */}
                  {repairResult && (
                    <div
                      className={`p-3 rounded-lg border flex flex-col gap-2 ${
                        repairResult.success
                          ? 'bg-emerald-950/40 border-emerald-500/40'
                          : 'bg-rose-950/40 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {repairResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className={repairResult.success ? 'text-emerald-300' : 'text-rose-300'}>
                          {repairResult.success ? 'Self-Repair Succeeded' : 'Self-Repair Incomplete'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {repairResult.message}
                      </p>

                      {/* Audit Trail list */}
                      <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Repair Audit Trail
                        </span>
                        {repairResult.auditTrail.map((item, idx) => (
                          <div key={idx} className="text-[10px] font-mono text-slate-300 flex items-start gap-1">
                            <span className="text-slate-500">{item.timestamp}</span>
                            <span className="text-indigo-400">•</span>
                            <span>{item.action} :</span>
                            <span className="text-emerald-400">{item.outcome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs italic my-auto">
                  Select any test case on the left to inspect assertion details, stack traces, and run AI failure diagnosis.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function FlaskIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2v7.31L4.66 18A2 2 0 0 0 6.38 21h11.24a2 2 0 0 0 1.72-3L14 9.31V2" />
      <line x1="8.5" x2="15.5" y1="2" y2="2" />
      <line x1="14" x2="14" y1="9" />
    </svg>
  );
}
