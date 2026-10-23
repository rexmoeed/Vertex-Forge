import React from 'react';
import {
  GitBranch,
  Plus,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  GitMerge,
} from 'lucide-react';
import { GitHistoryTab } from './GitHistoryTab';
import { GitBranchesTab } from './GitBranchesTab';
import { GitChangesTab } from './GitChangesTab';
import { GitStashesTab } from './GitStashesTab';
import { GitTagsTab } from './GitTagsTab';
import { GitIgnoreTab } from './GitIgnoreTab';
import { GitHubIntegrationTab } from './GitHubIntegrationTab';
import { useIDE } from '../../context/IDEContext';
import { MergeConflictModal } from '../modals/MergeConflictModal';
import { ConfirmDialogModal } from '../modals/ConfirmDialogModal';
import { useGitSidebarWorkflow, GitActiveTab } from './hooks/useGitSidebarWorkflow';
import { GitWorkflowService } from '../../services/gitWorkflowService';

export const GitSidebar: React.FC = () => {
  const { openFile, refreshGit } = useIDE();
  const wf = useGitSidebarWorkflow();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none font-sans overflow-hidden">
      {/* Toast Notification Banner */}
      {wf.notification && (
        <div
          className={`px-3 py-1.5 text-xs flex items-center justify-between border-b transition-all ${
            wf.notification.type === 'error'
              ? 'bg-rose-950/80 text-rose-200 border-rose-800'
              : wf.notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : 'bg-indigo-950/80 text-indigo-200 border-indigo-800'
          }`}
        >
          <span className="truncate">{wf.notification.text}</span>
          <button onClick={() => wf.setNotification(null)} className="ml-2 hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Source Control</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              wf.loadAll();
              refreshGit?.();
            }}
            disabled={wf.loading}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title="Refresh Git Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${wf.loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {wf.status.isRepo && (
            <>
              <button
                onClick={wf.handlePull}
                disabled={wf.loading}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                title="Pull latest changes from remote"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => wf.handlePush(false)}
                disabled={wf.loading}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                title="Push changes to remote"
              >
                <UploadCloud className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Repository Status Header or Init Prompt */}
      {!wf.status.isRepo ? (
        <div className="p-6 flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200 mb-1">No Git Repository Found</h4>
          <p className="text-xs text-slate-400 mb-4 max-w-[200px]">
            Initialize a Git repository in this folder to begin tracking history and collaborating.
          </p>
          <button
            onClick={wf.handleInitRepo}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize Repository
          </button>
        </div>
      ) : (
        <>
          {/* Active Branch Header */}
          <div className="px-3 py-2 bg-slate-950/20 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate text-slate-300 font-medium">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{wf.status.branch}</span>
              {wf.status.isDetached && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded">detached</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {wf.status.behind > 0 && (
                <span className="text-amber-400 flex items-center gap-0.5" title={`${wf.status.behind} commits behind remote`}>
                  ↓{wf.status.behind}
                </span>
              )}
              {wf.status.ahead > 0 && (
                <span className="text-emerald-400 flex items-center gap-0.5" title={`${wf.status.ahead} commits ahead of remote`}>
                  ↑{wf.status.ahead}
                </span>
              )}
              <span className="text-slate-500">•</span>
              <span>{wf.totalChanges} changed</span>
            </div>
          </div>

          {/* Merge Conflict Alert Banner */}
          {(wf.status.hasConflicts || wf.status.conflicted.length > 0) && (
            <div className="p-3 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Merge Conflicts: {wf.status.conflicted.length} file{wf.status.conflicted.length > 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => wf.setIsConflictModalOpen(true)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold shadow transition-colors flex items-center gap-1"
              >
                <GitMerge className="w-3.5 h-3.5" /> Resolve
              </button>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800 text-[11px] bg-slate-950/40 shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'changes', label: `Changes (${wf.totalChanges})` },
              { id: 'history', label: 'History' },
              { id: 'branches', label: 'Branches' },
              { id: 'stashes', label: 'Stash' },
              { id: 'tags', label: 'Tags' },
              { id: 'ignore', label: '.gitignore' },
              { id: 'github', label: 'GitHub' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => wf.setActiveTab(tab.id as GitActiveTab)}
                className={`px-3 py-2 border-b-2 font-medium whitespace-nowrap transition-colors ${
                  wf.activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CHANGES VIEW */}
          {wf.activeTab === 'changes' && (
            <GitChangesTab
              status={wf.status}
              commitMessage={wf.commitMessage}
              setCommitMessage={wf.setCommitMessage}
              amend={wf.amend}
              setAmend={wf.setAmend}
              aiLoading={wf.aiLoading}
              aiReviewResult={wf.aiReviewResult}
              setAiReviewResult={wf.setAiReviewResult}
              isCommitting={wf.isCommitting}
              onSuggestCommitMessage={wf.handleSuggestCommitMessage}
              onReviewWithAI={wf.handleReviewWithAI}
              onCommit={wf.handleCommit}
              onOpenFile={openFile}
              onStage={wf.handleStage}
              onStageAll={wf.handleStageAll}
              onUnstage={wf.handleUnstage}
              onUnstageAll={wf.handleUnstageAll}
              onDiscard={wf.handleDiscard}
              onDiscardAll={wf.handleDiscardAll}
            />
          )}

          {/* TAB 2: COMMIT HISTORY */}
          {wf.activeTab === 'history' && (
            <GitHistoryTab
              commits={wf.commits}
              onRefresh={() => GitWorkflowService.getLog(40).then(wf.setCommits)}
              onCherryPick={wf.handleCherryPick}
              onRevert={wf.handleRevert}
            />
          )}

          {/* TAB 3: BRANCHES & REMOTES */}
          {wf.activeTab === 'branches' && (
            <GitBranchesTab
              branches={wf.branches}
              currentBranch={wf.status.branch}
              onCreateBranch={wf.handleCreateBranch}
              onSwitchBranch={wf.handleCheckoutBranch}
              onDeleteBranch={wf.handleDeleteBranch}
              onMerge={wf.handleMergeBranch}
            />
          )}

          {/* TAB 4: STASHES */}
          {wf.activeTab === 'stashes' && (
            <GitStashesTab
              stashes={wf.stashes}
              onSaveStash={wf.handleSaveStash}
              onApplyStash={wf.handleApplyStash}
              onDropStash={wf.handleDropStash}
            />
          )}

          {/* TAB 5: TAGS */}
          {wf.activeTab === 'tags' && (
            <GitTagsTab
              tags={wf.tags}
              onCreateTag={wf.handleCreateTag}
              onDeleteTag={wf.handleDeleteTag}
            />
          )}

          {/* TAB 6: .GITIGNORE ASSISTANT */}
          {wf.activeTab === 'ignore' && (
            <GitIgnoreTab onAddPreset={wf.handleAddGitignorePreset} />
          )}

          {/* TAB 7: GITHUB INTEGRATION */}
          {wf.activeTab === 'github' && (
            <GitHubIntegrationTab
              gitHubAuthed={wf.gitHubAuthed}
              gitHubUser={wf.gitHubUser}
              gitHubOwner={wf.gitHubOwner}
              gitHubRepo={wf.gitHubRepo}
              pullRequests={wf.pullRequests}
              issues={wf.issues}
              onSaveToken={wf.handleSaveGitHubToken}
              onUpdateRepo={wf.handleUpdateGitHubRepo}
              onCreatePR={wf.handleCreatePR}
            />
          )}
        </>
      )}

      {/* Merge Conflict Resolution Modal */}
      <MergeConflictModal
        isOpen={wf.isConflictModalOpen}
        onClose={() => wf.setIsConflictModalOpen(false)}
        onResolved={() => {
          wf.loadAll();
          refreshGit?.();
        }}
      />

      {/* In-App Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={wf.confirmDialog.isOpen}
        title={wf.confirmDialog.title}
        message={wf.confirmDialog.message}
        confirmText={wf.confirmDialog.confirmText}
        severity={wf.confirmDialog.severity}
        onConfirm={async () => {
          const act = wf.confirmDialog.action;
          wf.setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          await act();
        }}
        onCancel={() => wf.setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
