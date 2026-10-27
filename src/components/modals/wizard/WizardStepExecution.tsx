import React from 'react';
import { Terminal, PackageCheck, ExternalLink, Copy, Play, Check } from 'lucide-react';
import { CreationExecutionResult, CreationLogEntry } from '../../../types/scaffolding';

interface Props {
  finalProjectPath: string;
  creationProgress: number;
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
  creationLogs: CreationLogEntry[];
  executionResult: CreationExecutionResult | null;
  onRevealInExplorer: () => void;
  onCopyPath: () => void;
  copiedPath: boolean;
  onOpenProject: () => void;
  revealNotice: boolean;
}

export const WizardStepExecution: React.FC<Props> = ({
  finalProjectPath,
  creationProgress,
  showLogs,
  setShowLogs,
  creationLogs,
  executionResult,
  onRevealInExplorer,
  onCopyPath,
  copiedPath,
  onOpenProject,
  revealNotice,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white">Filesystem Scaffolding & Verification</h3>
          <p className="text-[11px] text-slate-400 font-mono">{finalProjectPath}</p>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400">{creationProgress}%</span>
      </div>

      {/* Real Progress Bar */}
      <div className="w-full h-2.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${creationProgress}%` }}
        />
      </div>

      {/* Log View Header Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time Operation Stream ({creationLogs.length} events)</span>
        </span>
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 transition"
        >
          {showLogs ? 'Hide Creation Log' : 'View Creation Log'}
        </button>
      </div>

      {/* Live Streaming Terminal Logs */}
      {showLogs && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 flex flex-col gap-1.5 h-52 overflow-y-auto">
          {creationLogs.map(log => (
            <div key={log.id} className="flex items-start gap-2">
              <span className="text-slate-600 select-none">&gt;</span>
              <span
                className={
                  log.type === 'success'
                    ? 'text-emerald-400 font-bold'
                    : log.type === 'warn'
                    ? 'text-amber-400'
                    : log.type === 'error'
                    ? 'text-rose-400 font-bold'
                    : 'text-slate-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Final Completion Card */}
      {executionResult && executionResult.success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PackageCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Project Scaffolding Complete!</h4>
                <p className="text-[11px] text-emerald-400/80">
                  {executionResult.createdFilesCount} real files and {executionResult.createdDirsCount} directories generated on disk. Verified and ready.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRevealInExplorer}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                title="Reveal project directory in system file explorer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reveal in File Explorer</span>
              </button>

              <button
                onClick={onCopyPath}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPath ? 'Copied!' : 'Copy Path'}</span>
              </button>

              <button
                onClick={onOpenProject}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open Project in Editor</span>
              </button>
            </div>
          </div>

          {revealNotice && (
            <div className="p-2.5 bg-slate-900 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Project directory revealed: {finalProjectPath}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
