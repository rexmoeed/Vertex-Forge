import React from 'react';
import { Split, RotateCw, Zap } from 'lucide-react';
import { ParallelSubAgentActiveInfo, SubAgentTaskContract } from '../../../types/agentHierarchy';

interface Props {
  projectGoalInput: string;
  setProjectGoalInput: (val: string) => void;
  parallelConcurrency: number;
  setParallelConcurrency: (val: number) => void;
  isParallelRunning: boolean;
  activeParallelSubAgents: ParallelSubAgentActiveInfo[];
  tasks: SubAgentTaskContract[];
  activeProjectName?: string;
  onRunParallel: () => void;
  onDecomposeProject: (goal?: string) => void;
  onCancelParallel: () => void;
  onResetTasks: () => void;
}

export const AgentDecompositionToolbar: React.FC<Props> = ({
  projectGoalInput,
  setProjectGoalInput,
  parallelConcurrency,
  setParallelConcurrency,
  isParallelRunning,
  activeParallelSubAgents,
  tasks,
  activeProjectName,
  onRunParallel,
  onDecomposeProject,
  onCancelParallel,
  onResetTasks,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shrink-0">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white whitespace-nowrap">Dynamic Project Decomposition & Multi-Agent Parallel Tasking</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                {isParallelRunning ? `${activeParallelSubAgents.length} Active in Parallel` : 'Ready to Decompose'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap shrink-0">
                Workspace: {activeProjectName || 'Current Project'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Any project is decomposed into a structured DAG of sub-tasks across 10 specialized Team Leads and executed concurrently with file-lock concurrency control.
            </p>
          </div>
        </div>

        {/* Concurrency Selector */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 whitespace-nowrap shrink-0">
            <Split className="w-3 h-3 text-amber-400" />
            Parallel Threads:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => setParallelConcurrency(num)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                  parallelConcurrency === num
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={`Run up to ${num} sub-agents simultaneously`}
              >
                {num}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project Decomposition Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          onRunParallel();
        }}
        className="flex flex-col gap-2.5"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={projectGoalInput}
            onChange={e => setProjectGoalInput(e.target.value)}
            placeholder="Enter custom project goal (e.g. 'Build REST API with JWT authentication', 'Harmonize UI Design Tokens & Dark Mode', or leave blank for full project lifecycle)..."
            className="flex-1 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isParallelRunning}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            {isParallelRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-white" />}
            <span>{isParallelRunning ? 'Executing in Parallel...' : 'Decompose & Execute in Parallel'}</span>
          </button>
          <button
            type="button"
            onClick={() => onDecomposeProject()}
            disabled={isParallelRunning}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Decompose project into sub-tasks and inspect contracts DAG without immediate execution"
          >
            Decompose Only
          </button>
          {isParallelRunning ? (
            <button
              type="button"
              onClick={onCancelParallel}
              className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Stop
            </button>
          ) : tasks.length > 0 ? (
            <button
              type="button"
              onClick={onResetTasks}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Reset all tasks and contracts"
            >
              Reset
            </button>
          ) : null}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Presets:</span>
          {[
            'Full Workspace Engineering Audit & Quality Gate Verification',
            'API Endpoints, Schema Validation & Data Flow Operations',
            'UI Design Tokens, Responsive Components & WCAG AA Contrast',
            'AST Security Audit, Input Sanitization & Automated Unit Tests',
          ].map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setProjectGoalInput(preset);
                onDecomposeProject(preset);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 text-[10px] transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>

      {/* Live Parallel Concurrency Active Monitor */}
      {activeParallelSubAgents.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-600/10 to-emerald-500/10 border border-amber-500/40 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Parallel Tasking Active: {activeParallelSubAgents.length} Sub-Agents Executing Simultaneously
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Max Concurrency: {parallelConcurrency} Threads
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeParallelSubAgents.map(sub => (
              <div
                key={sub.taskId}
                className="p-3 bg-slate-950/90 border border-amber-500/30 rounded-xl flex flex-col gap-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{sub.leadRole}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Sub-Agent #{sub.subAgentIndex + 1}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 animate-pulse">
                    {sub.progress}%
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 font-medium truncate">{sub.taskTitle}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{sub.currentStep}</div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${sub.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
