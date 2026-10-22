import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { GitWorkingTreeStatus } from '../../types/gitWorkflow';

export interface GitChangesTabProps {
  status: GitWorkingTreeStatus;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  amend: boolean;
  setAmend: (amend: boolean) => void;
  aiLoading: boolean;
  aiReviewResult: string | null;
  setAiReviewResult: (res: string | null) => void;
  isCommitting: boolean;
  onSuggestCommitMessage: () => void;
  onReviewWithAI: () => void;
  onCommit: () => void;
  onOpenFile: (path: string, diff?: boolean) => void;
  onStage: (path: string) => void;
  onStageAll: () => void;
  onUnstage: (path: string) => void;
  onUnstageAll: () => void;
  onDiscard: (path: string) => void;
  onDiscardAll: () => void;
}

export const GitChangesTab: React.FC<GitChangesTabProps> = ({
  status,
  commitMessage,
  setCommitMessage,
  amend,
  setAmend,
  aiLoading,
  aiReviewResult,
  setAiReviewResult,
  isCommitting,
  onSuggestCommitMessage,
  onReviewWithAI,
  onCommit,
  onOpenFile,
  onStage,
  onStageAll,
  onUnstage,
  onUnstageAll,
  onDiscard,
  onDiscardAll,
}) => {
  const [stagedOpen, setStagedOpen] = useState(true);
  const [unstagedOpen, setUnstagedOpen] = useState(true);
  const [untrackedOpen, setUntrackedOpen] = useState(true);

  const totalChanges = status.staged.length + status.unstaged.length + status.untracked.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Commit Box */}
      <div className="p-3 border-b border-slate-800 flex flex-col gap-2 shrink-0">
        <div className="relative">
          <textarea
            placeholder="Commit message (e.g. feat(editor): add git workflow)..."
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-md p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 h-16 resize-none font-mono"
          />
          {/* AI Suggest Button */}
          <button
            onClick={onSuggestCommitMessage}
            disabled={aiLoading}
            className="absolute right-2 bottom-2 p-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[10px] flex items-center gap-1 transition-all"
            title="Generate commit message using AI"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>AI Msg</span>
          </button>
        </div>

        {/* Commit Actions Bar */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={amend}
              onChange={e => setAmend(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600"
            />
            <span>Amend last</span>
          </label>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onReviewWithAI}
              disabled={aiLoading || totalChanges === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
              title="AI review for regressions & bugs"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" /> Review
            </button>

            <button
              onClick={onCommit}
              disabled={isCommitting || (totalChanges === 0 && !amend)}
              className={
                'px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ' +
                (totalChanges > 0 || amend
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed')
              }
            >
              <Check className="w-3.5 h-3.5" />
              <span>{amend ? 'Amend Commit' : status.staged.length > 0 ? ('Commit (' + status.staged.length + ')') : 'Commit All'}</span>
            </button>
          </div>
        </div>

        {/* AI Review Result Floater */}
        {aiReviewResult && (
          <div className="mt-1 p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-indigo-300 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Diff Review
              </span>
              <button onClick={() => setAiReviewResult(null)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>
            <p className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {aiReviewResult}
            </p>
          </div>
        )}
      </div>

      {/* Changes Lists (Staged, Unstaged, Untracked) */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {/* 1. STAGED CHANGES */}
        {status.staged.length > 0 && (
          <div className="flex flex-col rounded bg-slate-850/40 border border-slate-800">
            <div className="flex items-center justify-between p-2 bg-slate-800/40">
              <button
                onClick={() => setStagedOpen(!stagedOpen)}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300"
              >
                {stagedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Staged Changes ({status.staged.length})</span>
              </button>
              <button
                onClick={onUnstageAll}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                title="Unstage All"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            {stagedOpen && (
              <div className="flex flex-col divide-y divide-slate-800/50">
                {status.staged.map(file => (
                  <div
                    key={file.filePath || (file as any).path}
                    className="flex items-center justify-between p-2 hover:bg-slate-800/40 text-xs transition-colors group"
                  >
                    <div
                      onClick={() => onOpenFile(file.filePath, true)}
                      className="flex-1 truncate cursor-pointer flex items-center gap-2 hover:text-indigo-300"
                      title="Click to view diff"
                    >
                      <span
                        className={
                          'text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ' +
                          (file.status === 'added'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : file.status === 'deleted'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400')
                        }
                      >
                        {file.status[0].toUpperCase()}
                      </span>
                      <span className="font-mono text-[11px] truncate">{file.filePath}</span>
                    </div>

                    <button
                      onClick={() => onUnstage(file.filePath)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 opacity-80 group-hover:opacity-100"
                      title="Unstage"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. UNSTAGED CHANGES */}
        <div className="flex flex-col rounded bg-slate-850/40 border border-slate-800">
          <div className="flex items-center justify-between p-2 bg-slate-800/40">
            <button
              onClick={() => setUnstagedOpen(!unstagedOpen)}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-white"
            >
              {unstagedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Changes ({status.unstaged.length})</span>
            </button>
            <div className="flex items-center gap-1">
              {status.unstaged.length > 0 && (
                <>
                  <button
                    onClick={onDiscardAll}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400"
                    title="Discard All Changes (Safety Confirmation)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onStageAll}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-400"
                    title="Stage All Changes"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {unstagedOpen && (
            <div className="flex flex-col divide-y divide-slate-800/50">
              {status.unstaged.length === 0 ? (
                <div className="p-3 text-[11px] text-slate-500 italic text-center">
                  Working tree clean.
                </div>
              ) : (
                status.unstaged.map(file => (
                  <div
                    key={file.filePath || (file as any).path}
                    className="flex items-center justify-between p-2 hover:bg-slate-800/40 text-xs transition-colors group"
                  >
                    <div
                      onClick={() => onOpenFile(file.filePath, true)}
                      className="flex-1 truncate cursor-pointer flex items-center gap-2 hover:text-indigo-300"
                      title="Click to view diff"
                    >
                      <span
                        className={
                          'text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ' +
                          (file.status === 'deleted'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400')
                        }
                      >
                        {file.status[0].toUpperCase()}
                      </span>
                      <span className="font-mono text-[11px] truncate">{file.filePath}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDiscard(file.filePath)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700 opacity-60 group-hover:opacity-100"
                        title="Discard Changes (Safety Warning)"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onStage(file.filePath)}
                        className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-700 opacity-80 group-hover:opacity-100"
                        title="Stage Changes"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 3. UNTRACKED FILES */}
        {status.untracked.length > 0 && (
          <div className="flex flex-col rounded bg-slate-850/40 border border-slate-800">
            <div className="flex items-center justify-between p-2 bg-slate-800/40">
              <button
                onClick={() => setUntrackedOpen(!untrackedOpen)}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300"
              >
                {untrackedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Untracked Files ({status.untracked.length})</span>
              </button>
              <button
                onClick={onStageAll}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-400"
                title="Stage All Untracked"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {untrackedOpen && (
              <div className="flex flex-col divide-y divide-slate-800/50">
                {status.untracked.map(file => (
                  <div
                    key={file.filePath || (file as any).path}
                    className="flex items-center justify-between p-2 hover:bg-slate-800/40 text-xs transition-colors group"
                  >
                    <div
                      onClick={() => onOpenFile(file.filePath)}
                      className="flex-1 truncate cursor-pointer flex items-center gap-2 hover:text-indigo-300"
                    >
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded font-mono bg-indigo-500/20 text-indigo-400">
                        U
                      </span>
                      <span className="font-mono text-[11px] truncate">{file.filePath}</span>
                    </div>

                    <button
                      onClick={() => onStage(file.filePath)}
                      className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-700 opacity-80 group-hover:opacity-100"
                      title="Stage File"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
