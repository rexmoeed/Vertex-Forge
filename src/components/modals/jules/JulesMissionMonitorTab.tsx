import React from 'react';
import {
  Cloud,
  GitPullRequest,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Clock,
  Terminal,
} from 'lucide-react';
import { JulesSession, JulesActivity } from '../../../services/julesService';

interface JulesMissionMonitorTabProps {
  currentSession: JulesSession | null;
  activities: JulesActivity[];
  copiedPr: boolean;
  isApproving: boolean;
  onApprovePlan: () => void;
  onCopyToClipboard: (url: string) => void;
  onSwitchToCreate: () => void;
  renderStatusBadge: (state?: string) => React.ReactNode;
}

export const JulesMissionMonitorTab: React.FC<JulesMissionMonitorTabProps> = ({
  currentSession,
  activities,
  copiedPr,
  isApproving,
  onApprovePlan,
  onCopyToClipboard,
  onSwitchToCreate,
  renderStatusBadge,
}) => {
  if (!currentSession) {
    return (
      <div className="text-center py-12 text-slate-400 space-y-3">
        <Cloud className="w-10 h-10 mx-auto text-slate-600 stroke-1" />
        <p className="text-xs">No active Jules cloud mission selected.</p>
        <button
          onClick={onSwitchToCreate}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          Launch a New Mission
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Active Mission Overview Card */}
      <div
        style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
        className="p-4 rounded-xl border space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {currentSession.title || 'Jules Autonomous Mission'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {currentSession.id || currentSession.name}
            </span>
          </div>
          {renderStatusBadge(currentSession.state)}
        </div>

        <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          {currentSession.prompt}
        </p>

        {/* PR Output Banner if completed */}
        {currentSession.outputs?.pullRequest && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <span>Pull Request #{currentSession.outputs.pullRequest.number}</span>
                  <span className="text-[10px] text-emerald-400/80 px-2 py-0.5 rounded-full bg-emerald-500/20">
                    Ready for Merge
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate max-w-md">
                  {currentSession.outputs.pullRequest.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onCopyToClipboard(currentSession.outputs!.pullRequest!.url)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPr ? 'Copied' : 'Copy URL'}</span>
              </button>
              <a
                href={currentSession.outputs.pullRequest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <span>Open on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Plan Approval Action Bar if Awaiting */}
        {currentSession.state === 'AWAITING_PLAN_APPROVAL' && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-indigo-200">Execution Plan Ready for Review</h4>
                <p className="text-[11px] text-indigo-300/80">
                  Google Jules has finished analysis and formulated 3 atomic change sets.
                </p>
              </div>
            </div>

            <button
              onClick={onApprovePlan}
              disabled={isApproving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isApproving ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Approve & Authorize Commits</span>
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Activity Log */}
      <div
        style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
        className="p-4 rounded-xl border space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Cloud VM Agent Execution Stream</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Live Poll: 4s</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs pr-1">
          {activities.map((act, index) => (
            <div
              key={index}
              className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-3"
            >
              <span className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
                {act.createTime}
              </span>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[11px] font-bold text-cyan-400">[{act.type}]</span>
                <p className="text-slate-300 text-xs">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
