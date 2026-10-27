import React from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  StopCircle,
  FileCheck,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import { useIDE } from '../../context/IDEContext';
import { useTestExplorer } from '../../hooks/useTestExplorer';
import { TestSuiteTreeView } from './modules/TestSuiteTreeView';
import { TestDiagnosticsPanel } from './modules/TestDiagnosticsPanel';
import { TestCaseResult } from '../../types/testEngine';

interface TestExplorerPanelProps {
  embedded?: boolean;
}

export const TestExplorerPanel: React.FC<TestExplorerPanelProps> = ({ embedded = false }) => {
  const { openFile } = useIDE();

  const {
    discovery,
    loadingDiscovery,
    runResult,
    isRunning,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    activeWorkspaceCwd,
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
  } = useTestExplorer();

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

  const handleOpenSourceLocation = (loc?: { filePath: string; line: number }) => {
    if (!loc) return;
    openFile?.(loc.filePath);
  };

  return (
    <div
      className={`flex flex-col h-full bg-slate-900 text-slate-200 select-none font-sans overflow-hidden ${
        embedded ? '' : 'p-3 gap-3'
      }`}
    >
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
            <div className="text-[10px] text-slate-400">Automated failure diagnosis & bounded self-repair</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isRunning ? (
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow animate-pulse cursor-pointer"
              title="Cancel Running Task"
            >
              <StopCircle className="w-3.5 h-3.5" /> Stop
            </button>
          ) : (
            <button
              onClick={() => handleRun('all')}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow transition-colors cursor-pointer"
              title="Run All Tests"
            >
              <Play className="w-3.5 h-3.5" /> Run All
            </button>
          )}

          {runResult && runResult.failed > 0 && !isRunning && (
            <button
              onClick={() => handleRun('failed')}
              className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Rerun Failed Tests Only"
            >
              <RotateCcw className="w-3 h-3" /> Failed ({runResult.failed})
            </button>
          )}

          <button
            onClick={() => handleRun('typecheck')}
            disabled={isRunning}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Run TypeScript Type Checks"
          >
            <Shield className="w-3 h-3 text-cyan-400" /> Typecheck
          </button>

          <button
            onClick={() => handleRun('lint')}
            disabled={isRunning}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Run Linting Analysis"
          >
            <FileCheck className="w-3 h-3 text-emerald-400" /> Lint
          </button>

          <button
            onClick={() => handleRun('build')}
            disabled={isRunning}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Run Production Build"
          >
            <Layers className="w-3 h-3 text-amber-400" /> Build
          </button>

          <button
            onClick={() => loadDiscovery(activeWorkspaceCwd)}
            disabled={loadingDiscovery}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
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

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              viewMode === 'tree' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Explorer
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
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

      {/* 3. MAIN BODY */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {viewMode === 'raw' ? (
          <div className="flex-1 p-3 bg-slate-950 font-mono text-xs text-slate-300 overflow-auto whitespace-pre leading-relaxed select-text">
            {runResult?.rawOutput || 'No test execution output recorded yet. Click "Run All" above.'}
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            <TestSuiteTreeView
              runResult={runResult}
              testsByFile={testsByFile}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              expandedFiles={expandedFiles}
              selectedTestCase={selectedTestCase}
              onToggleFile={toggleFile}
              onSelectTestCase={setSelectedTestCase}
              onRunAll={() => handleRun('all')}
              onRunFile={file => handleRun('file', file)}
              onDiagnose={handleDiagnose}
              onOpenFile={openFile}
            />

            <TestDiagnosticsPanel
              selectedTestCase={selectedTestCase}
              diagnosis={diagnosis}
              isDiagnosing={isDiagnosing}
              isRepairing={isRepairing}
              repairResult={repairResult}
              onRerunFile={file => handleRun('file', file)}
              onOpenSourceLocation={handleOpenSourceLocation}
              onDiagnose={handleDiagnose}
              onSelfRepair={handleSelfRepair}
            />
          </div>
        )}
      </div>
    </div>
  );
};
