import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SubAgentTaskContract, CompletionReport } from '../../../types/agentHierarchy';

interface AgentContractsTabProps {
  tasks: SubAgentTaskContract[];
  reports: CompletionReport[];
}

export const AgentContractsTab: React.FC<AgentContractsTabProps> = ({ tasks, reports }) => {
  return (
    <div className="flex flex-col gap-6" data-testid="agent-contracts-tab">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🔒 Sub-Agent Task Contracts & File Reservations</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Conflict-Free Concurrency
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Hierarchical task contracts prevent overwrite collisions across concurrent sub-agents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contracts Queue */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Task Delegation Contracts ({tasks.length})
          </span>
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto">
            {tasks.map(task => (
              <div
                key={task.taskId}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{task.title}</span>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    task.status === 'working' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                    task.status === 'waiting_dependency' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {task.status === 'working' ? '⚡ Parallel Active' : task.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-indigo-400">{task.parentAgentId}</span>
                  <span>&rarr;</span>
                  <span className="font-mono text-cyan-300">{task.subAgentRole}</span>
                </div>
                <p className="text-[11px] text-slate-300">{task.objective}</p>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60 text-slate-400">
                  <span className="font-mono truncate max-w-[170px] text-amber-300/80">
                    Files: {task.allowedFilePaths.join(', ')}
                  </span>
                  <span className="font-mono text-slate-500">
                    {task.dependencies.length > 0 ? `Deps: ${task.dependencies.length}` : 'Independent (Parallel)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Gate Completion Reports */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Quality Gate Completion Reports ({reports.length})
          </span>
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto">
            {reports.map((rep, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {rep.subAgentRole}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{rep.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">{rep.workCompleted}</p>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Test Assertions: <strong className="text-emerald-400">{rep.testResults}</strong> ({rep.testsRun.join(', ')})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
