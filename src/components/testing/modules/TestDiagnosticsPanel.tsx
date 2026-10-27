import React from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  Wrench,
  ExternalLink,
} from 'lucide-react';
import { TestCaseResult, FailureDiagnosis, SelfRepairResult } from '../../../types/testEngine';

interface TestDiagnosticsPanelProps {
  selectedTestCase: TestCaseResult | null;
  diagnosis: FailureDiagnosis | null;
  isDiagnosing: boolean;
  isRepairing: boolean;
  repairResult: SelfRepairResult | null;
  onRerunFile: (filePath: string) => void;
  onOpenSourceLocation: (loc?: { filePath: string; line: number }) => void;
  onDiagnose: (testCase: TestCaseResult) => void;
  onSelfRepair: () => void;
}

export const TestDiagnosticsPanel: React.FC<TestDiagnosticsPanelProps> = ({
  selectedTestCase,
  diagnosis,
  isDiagnosing,
  isRepairing,
  repairResult,
  onRerunFile,
  onOpenSourceLocation,
  onDiagnose,
  onSelfRepair,
}) => {
  if (!selectedTestCase) {
    return (
      <div className="w-full md:w-[420px] bg-slate-950/70 p-3 flex flex-col gap-3 overflow-y-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-800">
        <div className="p-6 text-center text-slate-500 text-xs italic my-auto">
          Select any test case on the left to inspect assertion details, stack traces, and run AI failure diagnosis.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[420px] bg-slate-950/70 p-3 flex flex-col gap-3 overflow-y-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-800">
      <div className="flex flex-col gap-3 text-xs">
        {/* Test Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="truncate flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedTestCase.status === 'passed' ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              <span className="font-bold text-white text-xs truncate">{selectedTestCase.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{selectedTestCase.filePath}</div>
          </div>

          <button
            onClick={() => onRerunFile(selectedTestCase.filePath)}
            className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] flex items-center gap-1 px-2 cursor-pointer"
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
                  onClick={() => onOpenSourceLocation(selectedTestCase.location)}
                  className="text-[10px] text-rose-300 hover:underline font-mono flex items-center gap-1 cursor-pointer"
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

            {selectedTestCase.errorStack && (
              <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded max-h-36 overflow-y-auto whitespace-pre leading-relaxed">
                {selectedTestCase.errorStack}
              </div>
            )}

            <button
              onClick={() => onDiagnose(selectedTestCase)}
              disabled={isDiagnosing}
              className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Root Cause</span>
              <p className="text-[11px] text-slate-200 mt-0.5 leading-relaxed font-sans">{diagnosis.rootCause}</p>
            </div>

            {diagnosis.proposedFix && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Proposed Patch ({diagnosis.proposedFix.targetFile})</span>
                  <span className="text-emerald-400 font-mono">
                    {Math.round(diagnosis.proposedFix.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 italic">{diagnosis.proposedFix.explanation}</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-300 whitespace-pre overflow-x-auto border border-slate-800">
                  {diagnosis.proposedFix.patch || 'Unified replacement code prepared.'}
                </div>
              </div>
            )}

            {diagnosis.regressionTest && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Regression Test Guard</span>
                <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-emerald-300/90 whitespace-pre overflow-x-auto border border-slate-800">
                  {diagnosis.regressionTest.testCode}
                </div>
              </div>
            )}

            <button
              onClick={onSelfRepair}
              disabled={isRepairing}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>{isRepairing ? 'Applying Patch & Verifying...' : 'Apply Self-Repair & Verify'}</span>
            </button>
          </div>
        )}

        {/* Self-Repair Outcome */}
        {repairResult && (
          <div
            className={`p-3 rounded-lg border flex flex-col gap-2 ${
              repairResult.success ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'
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
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{repairResult.message}</p>

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
    </div>
  );
};
