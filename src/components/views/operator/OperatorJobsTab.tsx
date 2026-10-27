import React from 'react';
import { Play } from 'lucide-react';
import type { useOperatorConsole } from '../../../hooks/useOperatorConsole';

interface Props {
  jobs: ReturnType<typeof useOperatorConsole>['jobs'];
  onTriggerJob: (id: string) => void;
  onResetCircuitBreaker: (id: string) => void;
}

export const OperatorJobsTab: React.FC<Props> = ({ jobs, onTriggerJob, onResetCircuitBreaker }) => {
  return (
    <div className="max-w-5xl flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-white">Self-Healing Background Jobs</h2>
        <p className="text-xs text-slate-400">
          Scheduled automated engineering jobs. Includes exponential backoff retry and circuit breakers on repetitive failures.
        </p>
      </div>

      <div className="space-y-2.5">
        {jobs.map(job => (
          <div key={job.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{job.name}</span>
                <code className="text-[10px] font-mono text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded">
                  {job.schedule}
                </code>
                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                    job.lastStatus === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : job.lastStatus === 'running'
                      ? 'bg-indigo-500/20 text-indigo-400 animate-pulse'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {job.lastStatus}
                </span>
              </div>
              {job.lastOutput && (
                <div className="text-[11px] text-slate-400 mt-1 font-mono">{job.lastOutput}</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onTriggerJob(job.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Run Now</span>
              </button>
              {job.circuitBroken && (
                <button
                  onClick={() => onResetCircuitBreaker(job.id)}
                  className="px-2.5 py-1 bg-rose-900 text-rose-200 rounded text-xs cursor-pointer font-bold"
                >
                  Reset Breaker
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
