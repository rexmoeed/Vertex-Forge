import { logger } from '../../services/logger';
import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Plus,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  GitMerge,
} from 'lucide-react';
import {
  GitWorkingTreeStatus,
  GitBranch as GitBranchType,
  GitCommitInfo,
  GitRemote,
  GitTag as GitTagType,
  GitStash,
  GitHubPullRequest,
  GitHubIssue,
} from '../../types/gitWorkflow';
import { GitHistoryTab } from './GitHistoryTab';
import { GitBranchesTab } from './GitBranchesTab';
import { GitChangesTab } from './GitChangesTab';
import { GitStashesTab } from './GitStashesTab';
import { GitTagsTab } from './GitTagsTab';
import { GitIgnoreTab } from './GitIgnoreTab';
import { GitHubIntegrationTab } from './GitHubIntegrationTab';
import { GitWorkflowService } from '../../services/gitWorkflowService';
import { useIDE } from '../../context/IDEContext';
import { MergeConflictModal } from '../modals/MergeConflictModal';
import { ConfirmDialogModal } from '../modals/ConfirmDialogModal';

export const GitSidebar: React.FC = () => {
  const { openFile, refreshGit } = useIDE();

  // Working tree status state
  const [status, setStatus] = useState<GitWorkingTreeStatus>({
    isRepo: true,
    branch: 'main',
    ahead: 0,
    behind: 0,
    isDetached: false,
    staged: [],
    unstaged: [],
    untracked: [],
    conflicted: [],
    hasConflicts: false,
  });
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [amend, setAmend] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Sub-sections collapse
  const [stagedOpen, setStagedOpen] = useState(true);
  const [unstagedOpen, setUnstagedOpen] = useState(true);
  const [untrackedOpen, setUntrackedOpen] = useState(true);

  // Bottom drawer tab
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches' | 'stashes' | 'tags' | 'ignore' | 'github'>('changes');

  // Commits / History
  const [commits, setCommits] = useState<GitCommitInfo[]>([]);
  const [branches, setBranches] = useState<GitBranchType[]>([]);
  const [remotes, setRemotes] = useState<GitRemote[]>([]);
  const [tags, setTags] = useState<GitTagType[]>([]);
  const [stashes, setStashes] = useState<GitStash[]>([]);

  // Modals & secondary state
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // AI assistant states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);

  // GitHub integration states
  const [gitHubAuthed, setGitHubAuthed] = useState(false);
  const [gitHubUser, setGitHubUser] = useState<any>(null);
  const [gitHubOwner, setGitHubOwner] = useState('');
  const [gitHubRepo, setGitHubRepo] = useState('');
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);

  const [notification, setNotification] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  // In-app confirmation dialog state (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    severity: 'danger' | 'warning' | 'info';
    action: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    severity: 'warning',
    action: () => {},
  });

  const showToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const treeStatus = await GitWorkflowService.getStatus();
      setStatus(treeStatus);

      // Extract GitHub owner/repo from remotes if available
      const remoteList = await GitWorkflowService.getRemotes();
      setRemotes(remoteList);
      const origin = remoteList.find(r => r.name === 'origin');
      if (origin?.fetchUrl) {
        const match = origin.fetchUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
        if (match && !gitHubOwner) {
          setGitHubOwner(match[1]);
          setGitHubRepo(match[2]);
        }
      }
    } catch (e: any) {
      logger.warn('Error loading Git status', { owner: gitHubOwner }, e);
    } finally {
      setLoading(false);
    }
  }, [gitHubOwner]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Load secondary data when tabs change
  useEffect(() => {
    if (activeTab === 'history') {
      GitWorkflowService.getLog(40).then(setCommits);
    } else if (activeTab === 'branches') {
      GitWorkflowService.getBranches().then(setBranches);
      GitWorkflowService.getRemotes().then(setRemotes);
    } else if (activeTab === 'stashes') {
      GitWorkflowService.getStashes().then(setStashes);
    } else if (activeTab === 'tags') {
      GitWorkflowService.getTags().then(setTags);
    } else if (activeTab === 'github') {
      GitWorkflowService.getGitHubAuthStatus().then(res => {
        setGitHubAuthed(res.authenticated);
        setGitHubUser(res.user);
        if (res.authenticated && gitHubOwner && gitHubRepo) {
          GitWorkflowService.getGitHubPullRequests(gitHubOwner, gitHubRepo).then(setPullRequests);
          GitWorkflowService.getGitHubIssues(gitHubOwner, gitHubRepo).then(setIssues);
        }
      });
    }
  }, [activeTab, gitHubOwner, gitHubRepo]);

  // Handle Init Repo
  const handleInitRepo = async () => {
    const res = await GitWorkflowService.initRepo();
    if (res.success) {
      showToast('Initialized new Git repository', 'success');
      loadAll();
      refreshGit?.();
    } else {
      showToast(res.error || 'Failed to initialize Git repository', 'error');
    }
  };

  // Staging handlers
  const handleStage = async (path: string) => {
    await GitWorkflowService.stage(path);
    loadAll();
    refreshGit?.();
  };

  const handleStageAll = async () => {
    await GitWorkflowService.stageAll();
    loadAll();
    refreshGit?.();
  };

  const handleUnstage = async (path: string) => {
    await GitWorkflowService.unstage(path);
    loadAll();
    refreshGit?.();
  };

  const handleUnstageAll = async () => {
    await GitWorkflowService.unstageAll();
    loadAll();
    refreshGit?.();
  };

  const handleDiscard = async (path: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Discard Changes',
      message: `Safety Warning: Discard uncommitted changes in "${path}"? Any edits will be permanently lost.`,
      confirmText: 'Discard Changes',
      severity: 'danger',
      action: async () => {
        await GitWorkflowService.discard(path);
        loadAll();
        refreshGit?.();
        showToast(`Discarded changes in ${path}`, 'info');
      },
    });
  };

  const handleDiscardAll = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Discard All Unstaged Changes',
      message: 'Safety Warning: Discard all unstaged changes across the repository? This cannot be undone.',
      confirmText: 'Discard All Changes',
      severity: 'danger',
      action: async () => {
        await GitWorkflowService.discardAll();
        loadAll();
        refreshGit?.();
        showToast('Discarded all working tree changes', 'info');
      },
    });
  };

  // Commit handler
  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      showToast('Please provide a commit message', 'error');
      return;
    }

    // If nothing staged, stage all before commit
    if (status.staged.length === 0 && (status.unstaged.length > 0 || status.untracked.length > 0)) {
      await GitWorkflowService.stageAll();
    }

    setIsCommitting(true);
    try {
      const res = await GitWorkflowService.commit(commitMessage.trim(), amend);
      if (res.success) {
        setCommitMessage('');
        setAmend(false);
        showToast('Committed changes successfully', 'success');
        loadAll();
        refreshGit?.();
      } else {
        showToast(res.error || 'Commit failed', 'error');
      }
    } finally {
      setIsCommitting(false);
    }
  };

  // Sync / Fetch / Pull / Push
  const handleFetch = async () => {
    setLoading(true);
    const res = await GitWorkflowService.fetchRemote();
    setLoading(false);
    if (res.success) {
      showToast('Fetched remote updates', 'success');
      loadAll();
    } else {
      showToast(res.error || 'Fetch failed', 'error');
    }
  };

  const handlePull = async () => {
    setLoading(true);
    const res = await GitWorkflowService.pull();
    setLoading(false);
    if (res.success) {
      showToast('Pulled latest changes from remote', 'success');
      loadAll();
      refreshGit?.();
    } else {
      showToast(res.error || 'Pull failed', 'error');
    }
  };

  const handlePush = async (force = false) => {
    if (force) {
      setConfirmDialog({
        isOpen: true,
        title: 'Force Push Warning',
        message: 'Safety Warning: Force pushing will overwrite remote branch history. Are you sure you want to proceed?',
        confirmText: 'Force Push',
        severity: 'danger',
        action: async () => {
          setLoading(true);
          const res = await GitWorkflowService.push('origin', undefined, true);
          setLoading(false);
          if (res.success) {
            showToast('Pushed changes to remote', 'success');
            loadAll();
          } else {
            showToast(res.error || 'Push failed. Check remote configuration.', 'error');
          }
        },
      });
      return;
    }
    setLoading(true);
    const res = await GitWorkflowService.push('origin', undefined, false);
    setLoading(false);
    if (res.success) {
      showToast('Pushed changes to remote', 'success');
      loadAll();
    } else {
      showToast(res.error || 'Push failed. Check remote configuration.', 'error');
    }
  };

  // AI Assistant Handlers
  const handleSuggestCommitMessage = async () => {
    setAiLoading(true);
    try {
      const msg = await GitWorkflowService.aiSuggestCommitMessage();
      if (msg) {
        setCommitMessage(msg);
        showToast('AI suggested commit message', 'success');
      }
    } catch {
      showToast('Failed to generate commit message', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReviewWithAI = async () => {
    setAiLoading(true);
    try {
      const diff = (await GitWorkflowService.getFileDiff('', true)).rawDiff;
      const review = await GitWorkflowService.aiReviewChanges(diff);
      setAiReviewResult(review);
    } catch {
      setAiReviewResult('Failed to review diff.');
    } finally {
      setAiLoading(false);
    }
  };

  // Branch handlers
  const handleCreateBranch = async (name: string) => {
    if (!name.trim()) return;
    const res = await GitWorkflowService.createBranch(name.trim(), true);
    if (res.success) {
      showToast(`Created & checked out branch "${name.trim()}"`, 'success');
      loadAll();
      GitWorkflowService.getBranches().then(setBranches);
    } else {
      showToast(res.error || 'Failed to create branch', 'error');
    }
  };
  const handleCheckoutBranch = async (branchName: string) => {
    const res = await GitWorkflowService.checkoutBranch(branchName);
    if (res.success) {
      showToast(`Switched to branch "${branchName}"`, 'success');
      loadAll();
      GitWorkflowService.getBranches().then(setBranches);
      refreshGit?.();
    } else {
      showToast(res.error || 'Failed to switch branch', 'error');
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (branchName === status.branch) {
      showToast('Cannot delete the currently active branch', 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Branch',
      message: `Safety Warning: Delete branch "${branchName}"? This branch will be removed from your local repository.`,
      confirmText: 'Delete Branch',
      severity: 'danger',
      action: async () => {
        const res = await GitWorkflowService.deleteBranch(branchName);
        if (res.success) {
          showToast(`Deleted branch "${branchName}"`, 'info');
          GitWorkflowService.getBranches().then(setBranches);
        } else {
          showToast(res.error || 'Failed to delete branch', 'error');
        }
      },
    });
  };

  // Stash handlers
  const handleSaveStash = async (msg?: string) => {
    const ok = await GitWorkflowService.saveStash(msg || undefined);
    if (ok) {
      showToast('Changes stashed', 'success');
      loadAll();
      GitWorkflowService.getStashes().then(setStashes);
      refreshGit?.();
    } else {
      showToast('Failed to save stash', 'error');
    }
  };

  const handleApplyStash = async (index = 0, pop = false) => {
    const ok = await GitWorkflowService.applyStash(`stash@{${index}}`, pop);
    if (ok) {
      showToast(pop ? 'Popped stash' : 'Applied stash', 'success');
      loadAll();
      GitWorkflowService.getStashes().then(setStashes);
      refreshGit?.();
    } else {
      showToast('Failed to apply stash', 'error');
    }
  };

  const handleDropStash = async (index: number) => {
    await GitWorkflowService.dropStash(`stash@{${index}}`);
    GitWorkflowService.getStashes().then(setStashes);
    showToast(`Dropped stash@{${index}}`, 'info');
  };

  const handleCreateTag = async (name: string) => {
    await GitWorkflowService.createTag(name);
    GitWorkflowService.getTags().then(setTags);
    showToast(`Created tag "${name}"`, 'success');
  };

  const handleDeleteTag = async (name: string) => {
    await GitWorkflowService.deleteTag(name);
    GitWorkflowService.getTags().then(setTags);
    showToast(`Deleted tag "${name}"`, 'info');
  };



  // Cherry-pick & Revert
  const handleCherryPick = async (hash: string) => {
    const res = await GitWorkflowService.cherryPick(hash);
    if (res.success) {
      showToast(`Cherry-picked commit ${hash.slice(0, 7)}`, 'success');
      loadAll();
      refreshGit?.();
    } else {
      showToast(res.error || 'Cherry-pick failed', 'error');
    }
  };

  const handleRevert = async (hash: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revert Commit',
      message: `Safety Warning: Create revert commit for ${hash.slice(0, 7)}?`,
      confirmText: 'Revert Commit',
      severity: 'warning',
      action: async () => {
        const res = await GitWorkflowService.revertCommit(hash);
        if (res.success) {
          showToast(`Reverted commit ${hash.slice(0, 7)}`, 'success');
          loadAll();
          refreshGit?.();
        } else {
          showToast(res.error || 'Revert failed', 'error');
        }
      },
    });
  };

  // .gitignore helper presets
  const handleAddGitignorePreset = async (type: string) => {
    let linesToAdd: string[] = [];
    if (type === 'node') {
      linesToAdd = ['node_modules/', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*'];
    } else if (type === 'env') {
      linesToAdd = ['.env', '.env.local', '.env.*.local'];
    } else if (type === 'build') {
      linesToAdd = ['dist/', 'build/', '.cache/', '.output/'];
    } else if (type === 'os') {
      linesToAdd = ['.DS_Store', 'Thumbs.db', '*.swp'];
    }

    try {
      // Append or create .gitignore
      const res = await fetch('/api/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: '.gitignore' }),
      });
      let currentContent = '';
      if (res.ok) {
        const data = await res.json();
        currentContent = data.content || '';
      }
      const newContent = `${currentContent.trim()}\n\n# ${type.toUpperCase()} PRESET\n${linesToAdd.join('\n')}\n`.trimStart();
      await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: '.gitignore', content: newContent }),
      });
      showToast(`Added ${type} rules to .gitignore`, 'success');
      loadAll();
      refreshGit?.();
    } catch {
      showToast('Failed to update .gitignore', 'error');
    }
  };

  const totalChanges = status.staged.length + status.unstaged.length + status.untracked.length;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none font-sans overflow-hidden">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`px-3 py-1.5 text-xs flex items-center justify-between border-b transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/80 text-rose-200 border-rose-800'
              : notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : 'bg-indigo-950/80 text-indigo-200 border-indigo-800'
          }`}
        >
          <span className="truncate">{notification.text}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-80">
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
              loadAll();
              refreshGit?.();
            }}
            disabled={loading}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Git Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Sync / Pull / Push Actions */}
          <button
            onClick={handlePull}
            disabled={loading}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Pull latest changes from remote"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handlePush(false)}
            disabled={loading}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Push changes to remote"
          >
            <UploadCloud className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Non-Repository State */}
      {!status.isRepo ? (
        <div className="p-6 flex flex-col items-center justify-center text-center gap-3 my-auto">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No Git Repository Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            This workspace is not currently tracked by Git. Initialize a repository to track file modifications, commit changes, and collaborate.
          </p>
          <button
            onClick={handleInitRepo}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Initialize Git Repository
          </button>
        </div>
      ) : (
        <>
          {/* Active Branch & Synced Status Strip */}
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-mono text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="font-semibold">{status.branch}</span>
              {status.isDetached && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-sans">
                  detached
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              {status.behind > 0 && (
                <span className="text-amber-400 flex items-center gap-0.5" title={`${status.behind} commits behind remote`}>
                  ↓{status.behind}
                </span>
              )}
              {status.ahead > 0 && (
                <span className="text-emerald-400 flex items-center gap-0.5" title={`${status.ahead} commits ahead of remote`}>
                  ↑{status.ahead}
                </span>
              )}
              <span className="text-slate-500">•</span>
              <span>{totalChanges} changed</span>
            </div>
          </div>

          {/* Merge Conflict Alert Banner */}
          {(status.hasConflicts || status.conflicted.length > 0) && (
            <div className="p-3 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Merge Conflicts: {status.conflicted.length} file{status.conflicted.length > 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setIsConflictModalOpen(true)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold shadow transition-colors flex items-center gap-1"
              >
                <GitMerge className="w-3.5 h-3.5" /> Resolve
              </button>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800 text-[11px] bg-slate-950/40 shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'changes', label: `Changes (${totalChanges})` },
              { id: 'history', label: 'History' },
              { id: 'branches', label: 'Branches' },
              { id: 'stashes', label: 'Stash' },
              { id: 'tags', label: 'Tags' },
              { id: 'ignore', label: '.gitignore' },
              { id: 'github', label: 'GitHub' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 border-b-2 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CHANGES VIEW */}
          {activeTab === 'changes' && (
            <GitChangesTab
              status={status}
              commitMessage={commitMessage}
              setCommitMessage={setCommitMessage}
              amend={amend}
              setAmend={setAmend}
              aiLoading={aiLoading}
              aiReviewResult={aiReviewResult}
              setAiReviewResult={setAiReviewResult}
              isCommitting={isCommitting}
              onSuggestCommitMessage={handleSuggestCommitMessage}
              onReviewWithAI={handleReviewWithAI}
              onCommit={handleCommit}
              onOpenFile={openFile}
              onStage={handleStage}
              onStageAll={handleStageAll}
              onUnstage={handleUnstage}
              onUnstageAll={handleUnstageAll}
              onDiscard={handleDiscard}
              onDiscardAll={handleDiscardAll}
            />
          )}
          {/* TAB 2: COMMIT HISTORY */}
          {activeTab === 'history' && (
            <GitHistoryTab
              commits={commits}
              onRefresh={() => GitWorkflowService.getLog(40).then(setCommits)}
              onCherryPick={handleCherryPick}
              onRevert={handleRevert}
            />
          )}

          {/* TAB 3: BRANCHES & REMOTES */}
          {activeTab === 'branches' && (
            <GitBranchesTab
              branches={branches}
              currentBranch={status.branch}
              onCreateBranch={async (name: string) => {
                const res = await GitWorkflowService.createBranch(name, true);
                if (res.success) {
                  showToast(`Created & checked out branch "${name}"`, 'success');
                  GitWorkflowService.getBranches().then(setBranches);
                } else {
                  showToast(res.error || 'Failed to create branch', 'error');
                }
              }}
              onSwitchBranch={handleCheckoutBranch}
              onDeleteBranch={handleDeleteBranch}
              onMerge={async (sourceBranch: string) => {
                const res = await GitWorkflowService.merge(sourceBranch);
                if (res.success) {
                  showToast(`Merged ${sourceBranch}`, 'success');
                } else if (!res.success) {
                  setIsConflictModalOpen(true);
                }
              }}
            />
          )}

          {/* TAB 4: STASHES */}
          {activeTab === 'stashes' && (
            <GitStashesTab
              stashes={stashes}
              onSaveStash={handleSaveStash}
              onApplyStash={handleApplyStash}
              onDropStash={handleDropStash}
            />
          )}

          {/* TAB 5: TAGS */}
          {activeTab === 'tags' && (
            <GitTagsTab
              tags={tags}
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
            />
          )}

          {/* TAB 6: .GITIGNORE ASSISTANT */}
          {activeTab === 'ignore' && (
            <GitIgnoreTab onAddPreset={handleAddGitignorePreset} />
          )}
          {/* TAB 7: GITHUB INTEGRATION */}
          {activeTab === 'github' && (
            <GitHubIntegrationTab
              gitHubAuthed={gitHubAuthed}
              gitHubUser={gitHubUser}
              gitHubOwner={gitHubOwner}
              gitHubRepo={gitHubRepo}
              pullRequests={pullRequests}
              issues={issues}
              onSaveToken={async (token) => {
                                const res = await GitWorkflowService.setGitHubToken(token);
                if (res.authenticated) {
                  setGitHubAuthed(true);
                  setGitHubUser(res.user);
                  showToast(`Authenticated as ${res.user?.login || 'GitHub user'}`, 'success');
                  if (gitHubOwner && gitHubRepo) {
                    GitWorkflowService.getGitHubPullRequests(gitHubOwner, gitHubRepo).then(setPullRequests);
                    GitWorkflowService.getGitHubIssues(gitHubOwner, gitHubRepo).then(setIssues);
                  }
                } else {
                  showToast('GitHub token verification failed', 'error');
                }
              }}
              onUpdateRepo={(owner, repo) => {
                setGitHubOwner(owner);
                setGitHubRepo(repo);
                if (gitHubAuthed && owner && repo) {
                  GitWorkflowService.getGitHubPullRequests(owner, repo).then(setPullRequests);
                  GitWorkflowService.getGitHubIssues(owner, repo).then(setIssues);
                }
              }}
              onCreatePR={async (title, body, base) => {
                if (!gitHubOwner || !gitHubRepo) return;
                try {
                  const res = await GitWorkflowService.createGitHubPullRequest({
                    owner: gitHubOwner,
                    repo: gitHubRepo,
                    title,
                    body,
                    head: status.branch,
                    base,
                  });
                  showToast(`Pull request created #${res.number}`, 'success');
                  if (gitHubOwner && gitHubRepo) {
                    GitWorkflowService.getGitHubPullRequests(gitHubOwner, gitHubRepo).then(setPullRequests);
                  }
                } catch (e: any) {
                  showToast(`Failed to create PR: ${e?.message || 'Error'}`, 'error');
                  logger.error('Failed to create GitHub pull request', { owner: gitHubOwner, repo: gitHubRepo }, e);
                }
              }}
            />
          )}
        </>
      )}

      {/* Merge Conflict Resolution Modal */}
      <MergeConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onResolved={() => {
          loadAll();
          refreshGit?.();
        }}
      />

      {/* In-App Confirmation Modal (Replaces window.confirm) */}
      <ConfirmDialogModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        severity={confirmDialog.severity}
        onConfirm={async () => {
          const act = confirmDialog.action;
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          await act();
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
