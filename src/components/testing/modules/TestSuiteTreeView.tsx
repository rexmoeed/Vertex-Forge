import React from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileCode,
  Search,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { TestCaseResult, TestRunResult } from '../../../types/testEngine';

interface TestSuiteTreeViewProps {
  runResult: TestRunResult | null;
  testsByFile: Record<string, TestCaseResult[]>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'all' | 'failed' | 'passed' | 'skipped';
  setStatusFilter: (f: 'all' | 'failed' | 'passed' | 'skipped') => void;
  expandedFiles: Record<string, boolean>;
  selectedTestCase: TestCaseResult | null;
  onToggleFile: (filePath: string) => void;
  onSelectTestCase: (test: TestCaseResult) => void;
  onRunAll: () => void;
  onRunFile: (filePath: string) => void;
  onDiagnose: (test: TestCaseResult) => void;
  onOpenFile?: (filePath: string) => void;
}

export const TestSuiteTreeView: React.FC<TestSuiteTreeViewProps> = ({
  runResult,
  testsByFile,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  expandedFiles,
  selectedTestCase,
  onToggleFile,
  onSelectTestCase,
  onRunAll,
  onRunFile,
  onDiagnose,
  onOpenFile,
}) => {
  return (
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
              className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
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
            <span className="text-xs">No active test results.</span>
            <button
              onClick={onRunAll}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5 mt-1 cursor-pointer"
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
                  onClick={() => onToggleFile(filePath)}
                  className="flex items-center gap-1.5 font-mono text-xs truncate flex-1 text-left cursor-pointer"
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
                      onOpenFile?.(filePath);
                    }}
                    className="text-slate-200 hover:text-indigo-300 hover:underline truncate"
                    title="Open test file in editor"
                  >
                    {filePath}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      hasFailure ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {tests.filter(t => t.status === 'passed').length}/{tests.length}
                  </span>

                  <button
                    onClick={() => onRunFile(filePath)}
                    className="p-1 hover:bg-indigo-600 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
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
                      onClick={() => onSelectTestCase(test)}
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
                              onDiagnose(test);
                            }}
                            className="p-1 hover:bg-rose-600 text-rose-300 hover:text-white rounded transition-colors cursor-pointer"
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
  );
};
