import React from 'react';
import { Play, Sparkles, XCircle, Wrench, CheckCircle2 } from 'lucide-react';

interface TestItem {
  id: string | number;
  testName: string;
  testSuite?: string;
  filePath?: string;
  status: 'passed' | 'failed' | string;
  errorStack?: string;
}

interface AgentQATabProps {
  testResults: TestItem[];
  failedTests: number;
  runTests: () => void;
  triggerSelfHealDebug: (errorStack?: string) => void;
}

export const AgentQATab: React.FC<AgentQATabProps> = ({
  testResults,
  failedTests,
  runTests,
  triggerSelfHealDebug,
}) => {
  const failingTest = testResults.find(t => t.status === 'failed');

  return (
    <div className="flex flex-col gap-6" data-testid="agent-qa-tab">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🧪 Lead QA & Automated Self-Healing Debugger</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              failedTests > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {failedTests > 0 ? `${failedTests} Assertion Failure Detected` : 'All Test Suites Passing'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Test strategy, execution results, root cause analysis, and automated self-correction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runTests}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Run Vitest Suite</span>
          </button>

          {failedTests > 0 && (
            <button
              onClick={() => triggerSelfHealDebug()}
              className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trigger 1-Click Self-Heal</span>
            </button>
          )}
        </div>
      </div>

      {/* Failing Test Diagnosis Card */}
      {failedTests > 0 ? (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <XCircle className="w-4 h-4" />
              <span>Failure Diagnosis: {failingTest?.testName || 'Test assertion failure'}</span>
            </div>
            <span className="text-[10px] font-mono text-rose-300">{failingTest?.filePath || 'Workspace Test'}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-rose-300 overflow-x-auto">
            <div>FAIL {failingTest?.testSuite || failingTest?.filePath} &gt; {failingTest?.testName}</div>
            {failingTest?.errorStack && (
              <div className="text-slate-400 mt-1 whitespace-pre-wrap">{failingTest.errorStack}</div>
            )}
          </div>

          <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 flex flex-col gap-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Root Cause Analysis by AI Debugger:
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Failure detected in <code className="text-indigo-300 font-mono">{failingTest?.filePath}</code> during assertion verification. Self-healing debugger can analyze the stack trace and generate an AST repair patch.
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 font-mono">Automated Fix Ready: Inspect stack trace and synthesize patch.</span>
              <button
                onClick={() => triggerSelfHealDebug(failingTest?.errorStack)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow"
              >
                Apply Self-Healing Patch
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col items-center justify-center text-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          <span className="font-bold text-emerald-300 text-sm">All Test Suites Verified & Green</span>
          <p className="text-xs text-slate-400 max-w-md">
            Vitest unit assertions, RBAC permissions matrix, and acceptance tests are passing with zero regressions.
          </p>
        </div>
      )}

      {/* Test Coverage & Suites Table */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Suite Coverage</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
          {testResults.map((t: any) => (
            <div
              key={t.id}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                t.status === 'passed'
                  ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="truncate mr-2">
                <span className="font-bold block truncate">{t.testName}</span>
                <span className="text-[10px] text-slate-500 font-mono">{t.testSuite}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded ${
                t.status === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
