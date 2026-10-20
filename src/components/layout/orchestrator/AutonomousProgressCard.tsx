import React, { useState } from 'react';
import {
  Cpu,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  Terminal,
  ChevronDown,
} from 'lucide-react';
import { AutonomousPlan, AutonomousExecutionState, AutonomousTask, StepExecutionRecord, VerificationSummary } from '../../../types/autonomousAgent';

export interface AutonomousProgressCardProps {
  autonomousPlan: AutonomousPlan | null;
  autonomousExecutionState: AutonomousExecutionState;
  progressPercent: number;
  pauseAutonomousPlan: () => void;
  resumeAutonomousPlan: () => void;
  cancelAutonomousPlan: () => void;
  rollbackAutonomousPlan: () => void;
  approveAutonomousPlan: () => void;
  rejectAutonomousPlan: () => void;
  retryAutonomousTask: (taskId: string) => void;
  verificationSummary: VerificationSummary | null;
}

export const AutonomousProgressCard: React.FC<AutonomousProgressCardProps> = ({
  autonomousPlan,
  autonomousExecutionState,
  progressPercent,
  pauseAutonomousPlan,
  resumeAutonomousPlan,
  cancelAutonomousPlan,
  rollbackAutonomousPlan,
  approveAutonomousPlan,
  rejectAutonomousPlan,
  retryAutonomousTask,
  verificationSummary,
}) => {
  const [showToolActivity, setShowToolActivity] = useState<boolean>(false);

  return (
    <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-2.5 shadow-xs text-xs">
      {/* Header with Title and State Badge */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="font-bold text-slate-900 dark:text-slate-100">Autonomous Engineer</span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
            autonomousExecutionState === 'completed'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : autonomousExecutionState === 'executing'
              ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 animate-pulse'
              : autonomousExecutionState === 'waiting_plan_approval' ||
                autonomousExecutionState === 'waiting_step_approval'
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : autonomousExecutionState === 'paused'
              ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30'
              : autonomousExecutionState === 'failed'
              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          {autonomousExecutionState}
        </span>
      </div>

      {/* Plan Goal */}
      {autonomousPlan?.goal && (
        <p className="text-[11px] text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80 font-mono line-clamp-2">
          {autonomousPlan.goal}
        </p>
      )}

      {/* Progress Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/80">
        {autonomousExecutionState === 'executing' && (
          <button
            onClick={pauseAutonomousPlan}
            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-750 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            title="Pause execution loop"
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>
        )}
        {autonomousExecutionState === 'paused' && (
          <button
            onClick={resumeAutonomousPlan}
            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            title="Resume execution loop"
          >
            <Play className="w-3 h-3" />
            <span>Resume</span>
          </button>
        )}
        <button
          onClick={cancelAutonomousPlan}
          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          title="Abort current autonomous mission"
        >
          <RotateCcw className="w-3 h-3 text-rose-500" />
          <span>Cancel</span>
        </button>
        <button
          onClick={rollbackAutonomousPlan}
          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          title="Rollback all autonomous changes via git"
        >
          <Undo2 className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
          <span>Rollback</span>
        </button>
      </div>

      {/* Plan Approval Card */}
      {autonomousExecutionState === 'waiting_plan_approval' && autonomousPlan && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-2 text-amber-900 dark:text-amber-200 mt-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Review Autonomous Plan</span>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-200/90">
            The agent synthesized {autonomousPlan.tasks.length} tasks for your approval:
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {autonomousPlan.tasks.map((t: AutonomousTask, idx: number) => (
              <div
                key={t.id}
                className="p-1.5 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300"
              >
                <div className="font-bold text-slate-900 dark:text-white">
                  {idx + 1}. {t.title}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[9px] truncate">
                  {t.description}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={approveAutonomousPlan}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
            >
              Approve Plan & Begin
            </button>
            <button
              onClick={rejectAutonomousPlan}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Interactive Task State Machine */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mt-1">
        {autonomousPlan?.tasks.map((t: AutonomousTask, idx: number) => (
          <div
            key={t.id}
            className={`p-2 rounded-lg border text-[11px] transition-colors flex flex-col gap-1 ${
              t.status === 'running'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-100'
                : t.status === 'completed'
                ? 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                : t.status === 'failed'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                {t.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                ) : t.status === 'running' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-spin shrink-0" />
                ) : t.status === 'failed' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                ) : t.status === 'blocked' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {idx + 1}. {t.title}
                </span>
              </div>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 shrink-0">
                {t.status}
              </span>
            </div>

            {t.error && (
              <div className="flex items-center justify-between text-[10px] text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 p-1 rounded">
                <span className="truncate">{t.error}</span>
                <button
                  onClick={() => retryAutonomousTask(t.id)}
                  className="text-indigo-600 dark:text-cyan-300 hover:underline font-bold text-[9px] ml-1 shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Collapsible Live Tool Activity Inspector */}
      {autonomousPlan && (
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2">
          <button
            onClick={() => setShowToolActivity(!showToolActivity)}
            className="flex items-center justify-between w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-[11px] font-mono cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
              <span>Tool Activity Stream</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showToolActivity ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showToolActivity && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-900/90 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono">
              {autonomousPlan.tasks.flatMap((t: AutonomousTask) => t.executionHistory).length ===
              0 ? (
                <div className="text-slate-400 text-center py-2">No tool calls recorded yet</div>
              ) : (
                autonomousPlan.tasks
                  .flatMap((t: AutonomousTask) => t.executionHistory)
                  .map((record: StepExecutionRecord) => (
                    <div
                      key={record.id}
                      className="p-1 rounded bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-indigo-600 dark:text-cyan-300 font-bold">
                          {record.tool}
                        </span>
                        <span
                          className={
                            record.result.success
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {record.result.success ? 'OK' : 'ERR'} ({record.result.durationMs || 0}ms)
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[9px] truncate">
                        {record.observation}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Real Verification Summary Card */}
      {verificationSummary && (
        <div
          className={`p-2.5 rounded-xl border flex flex-col gap-2 mt-1 text-xs ${
            verificationSummary.overallSuccess
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Verification Report</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white shadow-xs">
              {verificationSummary.overallSuccess ? 'PASSED' : 'CHECK ISSUES'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="p-1 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Files Changed:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {verificationSummary.filesChanged.length}
              </span>
            </div>
            <div className="p-1 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Tests:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-300">
                {verificationSummary.testsPassed} passed
              </span>
            </div>
            <div className="p-1 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Type Soundness:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {verificationSummary.typeCheckPassed ? 'Clean' : 'Errors'}
              </span>
            </div>
            <div className="p-1 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Commands:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {verificationSummary.commandsExecuted.length} run
              </span>
            </div>
          </div>

          {verificationSummary.remainingRisks.length > 0 && (
            <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/40 p-1.5 rounded border border-amber-300 dark:border-amber-500/20">
              <span className="font-bold block">Remaining Risks:</span>
              <span>{verificationSummary.remainingRisks.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
