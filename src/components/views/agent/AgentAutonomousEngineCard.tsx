import React from 'react';
import {
  Cpu,
  RotateCw,
  Send,
  Pause,
  Play,
  X,
  Undo2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { AutonomousTask } from '../../../types/autonomousAgent';

interface Props {
  autonomousExecutionState: string;
  autonomyMode: 'autonomous' | 'supervised' | 'strict' | string;
  setAutonomyMode: (mode: any) => void;
  autonomousInput: string;
  setAutonomousInput: (val: string) => void;
  isLaunching: boolean;
  onLaunch: (input: string) => Promise<void>;
  autonomousPlan: any;
  onPausePlan: () => void;
  onResumePlan: () => void;
  onCancelPlan: () => void;
  onRollbackPlan: () => void;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onRetryTask: (taskId: string) => void;
}

export const AgentAutonomousEngineCard: React.FC<Props> = ({
  autonomousExecutionState,
  autonomyMode,
  setAutonomyMode,
  autonomousInput,
  setAutonomousInput,
  isLaunching,
  onLaunch,
  autonomousPlan,
  onPausePlan,
  onResumePlan,
  onCancelPlan,
  onRollbackPlan,
  onApprovePlan,
  onRejectPlan,
  onRetryTask,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Autonomous AI Software Engineer</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {autonomousExecutionState || 'IDLE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Understand → Inspect → Plan → Execute → Observe → Diagnose → Correct → Verify → Summarize
            </p>
          </div>
        </div>

        {/* Safety & Permission Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold px-2">Safety:</span>
          {(['autonomous', 'supervised', 'strict'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setAutonomyMode(mode)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                autonomyMode === mode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input Form */}
      <form
        onSubmit={async e => {
          e.preventDefault();
          if (!autonomousInput.trim() || isLaunching) return;
          await onLaunch(autonomousInput.trim());
        }}
        className="flex flex-col gap-2.5"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={autonomousInput}
            onChange={e => setAutonomousInput(e.target.value)}
            placeholder="Describe requested changes (e.g. 'Add input validation and unit tests', 'Fix broken imports')..."
            className="flex-1 bg-slate-950 border border-slate-750 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!autonomousInput.trim() || isLaunching}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            {isLaunching ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Launch Autonomous Engineer</span>
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Presets:</span>
          {[
            'Implement priority weight validation with unit tests',
            'Audit task transition RBAC matrix and harden security',
            'Refactor error handling with self-healing try-catch blocks',
          ].map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAutonomousInput(preset)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>

      {/* Active Plan & Controls */}
      {autonomousPlan && (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Goal</span>
              <span className="text-xs font-mono font-bold text-indigo-300">{autonomousPlan.goal}</span>
            </div>
            <div className="flex items-center gap-2">
              {autonomousExecutionState === 'executing' && (
                <button
                  onClick={onPausePlan}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3 h-3" />
                  <span>Pause</span>
                </button>
              )}
              {autonomousExecutionState === 'paused' && (
                <button
                  onClick={onResumePlan}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={onCancelPlan}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Cancel</span>
              </button>
              <button
                onClick={onRollbackPlan}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Rollback agent modifications using latest checkpoint"
              >
                <Undo2 className="w-3 h-3" />
                <span>Rollback Changes</span>
              </button>
            </div>
          </div>

          {/* Plan Approval Banner */}
          {autonomousExecutionState === 'waiting_plan_approval' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-200">
              <div>
                <div className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Human Approval Required for Plan</span>
                </div>
                <span className="text-[11px] text-slate-300">
                  Review {autonomousPlan.tasks.length} tasks before autonomous modifications proceed.
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onApprovePlan}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow cursor-pointer"
                >
                  Approve Plan & Begin
                </button>
                <button
                  onClick={onRejectPlan}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Task State Machine Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {autonomousPlan.tasks.map((task: AutonomousTask, idx: number) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-xs transition-all ${
                  task.status === 'running'
                    ? 'bg-indigo-950/70 border-indigo-500/60 shadow-lg text-indigo-100'
                    : task.status === 'completed'
                    ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                    : task.status === 'failed'
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    : task.status === 'blocked'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/50 border-slate-850 text-slate-400'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">Task #{idx + 1}</span>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {task.status}
                    </span>
                  </div>
                  <span className="font-bold text-white text-xs">{task.title}</span>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{task.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono text-cyan-400 truncate max-w-[140px]">
                    {task.targetFiles[0] || 'Multiple files'}
                  </span>
                  {task.status === 'failed' && (
                    <button
                      onClick={() => onRetryTask(task.id)}
                      className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
