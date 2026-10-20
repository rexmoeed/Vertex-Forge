import { logger } from '../../services/logger';
import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Sparkles,
  Clock,
  Tag,
  Archive,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Github,
  PlusCircle,
  FileX,
  FileText,
  UploadCloud,
  DownloadCloud,
  SplitSquareVertical,
  ShieldAlert,
  GitMerge,
  Info,
} from 'lucide-react';
import {
  GitWorkingTreeStatus,
  GitFileStatus,
  GitBranch as GitBranchType,
  GitCommitInfo,
  GitRemote,
  GitTag as GitTagType,
  GitStash,
  GitHubPullRequest,
  GitHubIssue,
} from '../../types/gitWorkflow';
import { GitWorkflowService } from '../../services/gitWorkflowService';
import { useIDE } from '../../context/IDEContext';
import { MergeConflictModal } from '../modals/MergeConflictModal';
import { ConfirmDialogModal } from '../modals/ConfirmDialogModal';

export const GitSidebar: React.FC = () => {
  const { openFile, refreshGit } = useIDE() as any;

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

  // Modals & inputs
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [stashMessage, setStashMessage] = useState('');
  const [tagName, setTagName] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');

  // AI assistant states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);

  // GitHub integration states
  const [gitHubAuthed, setGitHubAuthed] = useState(false);
  const [gitHubUser, setGitHubUser] = useState<any>(null);
  const [gitHubTokenInput, setGitHubTokenInput] = useState('');
  const [gitHubOwner, setGitHubOwner] = useState('');
  const [gitHubRepo, setGitHubRepo] = useState('');
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [isCreatingPr, setIsCreatingPr] = useState(false);

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
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    const res = await GitWorkflowService.createBranch(newBranchName.trim(), true);
    if (res.success) {
      setNewBranchName('');
      setIsCreatingBranch(false);
      showToast(`Created & checked out branch "${newBranchName.trim()}"`, 'success');
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
  const handleSaveStash = async () => {
    const ok = await GitWorkflowService.saveStash(stashMessage || undefined);
    if (ok) {
      setStashMessage('');
      showToast('Changes stashed', 'success');
      loadAll();
      GitWorkflowService.getStashes().then(setStashes);
      refreshGit?.();
    } else {
      showToast('Failed to save stash', 'error');
    }
  };

  const handleApplyStash = async (index = 0, pop = true) => {
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

  // GitHub Auth & Token Handler
  const handleSaveGitHubToken = async () => {
    if (!gitHubTokenInput.trim()) return;
    const res = await GitWorkflowService.setGitHubToken(gitHubTokenInput.trim());
    if (res.authenticated) {
      setGitHubAuthed(true);
      setGitHubUser(res.user);
      setGitHubTokenInput('');
      showToast(`Authenticated as ${res.user?.login || 'GitHub user'}`, 'success');
      if (gitHubOwner && gitHubRepo) {
        GitWorkflowService.getGitHubPullRequests(gitHubOwner, gitHubRepo).then(setPullRequests);
        GitWorkflowService.getGitHubIssues(gitHubOwner, gitHubRepo).then(setIssues);
      }
    } else {
      showToast(res.error || 'Failed to authenticate token', 'error');
    }
  };

  const handleCreatePullRequest = async () => {
    if (!prTitle.trim() || !gitHubOwner || !gitHubRepo) return;
    try {
      const res = await GitWorkflowService.createGitHubPullRequest({
        owner: gitHubOwner,
        repo: gitHubRepo,
        title: prTitle.trim(),
        body: prBody.trim(),
        head: status.branch,
        base: 'main',
      });
      if (res.success) {
        showToast('Created Pull Request successfully', 'success');
        setPrTitle('');
        setPrBody('');
        setIsCreatingPr(false);
        GitWorkflowService.getGitHubPullRequests(gitHubOwner, gitHubRepo).then(setPullRequests);
      } else {
        showToast(res.error || 'Failed to create PR', 'error');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'PR creation error';
      logger.error('Failed to create GitHub pull request', { owner: gitHubOwner, repo: gitHubRepo }, e);
      showToast(msg, 'error');
    }
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
                    onClick={handleSuggestCommitMessage}
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
                      onClick={handleReviewWithAI}
                      disabled={aiLoading || totalChanges === 0}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="AI review for regressions & bugs"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" /> Review
                    </button>

                    <button
                      onClick={handleCommit}
                      disabled={isCommitting || (totalChanges === 0 && !amend)}
                      className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                        totalChanges > 0 || amend
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{amend ? 'Amend Commit' : status.staged.length > 0 ? `Commit (${status.staged.length})` : 'Commit All'}</span>
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
                        onClick={handleUnstageAll}
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
                            key={file.filePath}
                            className="flex items-center justify-between p-2 hover:bg-slate-800/40 text-xs transition-colors group"
                          >
                            <div
                              onClick={() => openFile(file.filePath, true)}
                              className="flex-1 truncate cursor-pointer flex items-center gap-2 hover:text-indigo-300"
                              title="Click to view diff"
                            >
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                  file.status === 'added'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : file.status === 'deleted'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {file.status[0].toUpperCase()}
                              </span>
                              <span className="font-mono text-[11px] truncate">{file.filePath}</span>
                            </div>

                            <button
                              onClick={() => handleUnstage(file.filePath)}
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
                            onClick={handleDiscardAll}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400"
                            title="Discard All Changes (Safety Confirmation)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleStageAll}
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
                            key={file.filePath}
                            className="flex items-center justify-between p-2 hover:bg-slate-800/40 text-xs transition-colors group"
                          >
                            <div
                              onClick={() => openFile(file.filePath, true)}
                              className="flex-1 truncate cursor-pointer flex items-center gap-2 hover:text-indigo-300"
                              title="Click to view diff"
                            >
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                  file.status === 'deleted'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {file.status[0].toUpperCase()}
                              </span>
                              <span className="font-mono text-[11px] truncate">{file.filePath}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDiscard(file.filePath)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700 opacity-60 group-hover:opacity-100"
                                title="Discard Changes (Safety Warning)"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleStage(file.filePath)}
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
                        onClick={handleStageAll}
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
                            key={file.filePath}
                            className="flex items-center justify-between p-2 hover:bg-slate-800/40 text-xs transition-colors group"
                          >
                            <div
                              onClick={() => openFile(file.filePath)}
                              className="flex-1 truncate cursor-pointer flex items-center gap-2 hover:text-indigo-300"
                            >
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded font-mono bg-indigo-500/20 text-indigo-400">
                                U
                              </span>
                              <span className="font-mono text-[11px] truncate">{file.filePath}</span>
                            </div>

                            <button
                              onClick={() => handleStage(file.filePath)}
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
          )}

          {/* TAB 2: COMMIT HISTORY */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1 font-semibold">
                <span>Recent Commits ({commits.length})</span>
                <button onClick={() => GitWorkflowService.getLog(40).then(setCommits)} className="hover:text-white">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {commits.map(commit => (
                <div
                  key={commit.hash}
                  className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5 text-xs hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-indigo-400 font-bold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      {commit.shortHash}
                    </span>
                    <span className="text-[10px] text-slate-400">{commit.relativeTime}</span>
                  </div>

                  <p className="text-slate-200 font-medium line-clamp-2 leading-tight">
                    {commit.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="truncate">{commit.author}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCherryPick(commit.hash)}
                        className="px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors"
                        title="Cherry-pick this commit"
                      >
                        Cherry-pick
                      </button>
                      <button
                        onClick={() => handleRevert(commit.hash)}
                        className="px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-rose-600 hover:text-white text-slate-300 transition-colors"
                        title="Revert this commit"
                      >
                        Revert
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: BRANCHES & REMOTES */}
          {activeTab === 'branches' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 text-xs">
              {/* Create Branch */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Create Branch</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="branch-name..."
                    value={newBranchName}
                    onChange={e => setNewBranchName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleCreateBranch}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow"
                  >
                    Create
                  </button>
                </div>
              </div>

              {/* Local Branches List */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Branches ({branches.length})
                </span>
                <div className="flex flex-col divide-y divide-slate-800 bg-slate-800/40 rounded-lg border border-slate-700/60 overflow-hidden">
                  {branches.map(b => (
                    <div
                      key={b.name}
                      className="p-2 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                    >
                      <div
                        onClick={() => !b.isCurrent && handleCheckoutBranch(b.name)}
                        className={`flex items-center gap-1.5 font-mono cursor-pointer truncate ${
                          b.isCurrent ? 'text-indigo-300 font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{b.name}</span>
                        {b.isCurrent && (
                          <span className="px-1.5 py-0.2 bg-indigo-600/30 text-indigo-300 text-[10px] rounded font-sans">
                            active
                          </span>
                        )}
                      </div>

                      {!b.isCurrent && (
                        <button
                          onClick={() => handleDeleteBranch(b.name)}
                          className="p-1 hover:text-rose-400 text-slate-500 rounded hover:bg-slate-700"
                          title="Delete branch (Safeguarded)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Remotes */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Remotes ({remotes.length})
                </span>
                {remotes.map(r => (
                  <div key={r.name} className="p-2 bg-slate-800/40 rounded border border-slate-700/60 flex flex-col gap-0.5">
                    <span className="font-bold text-slate-200 font-mono">{r.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">{r.fetchUrl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STASHES */}
          {activeTab === 'stashes' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Save Stash</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Stash description (optional)..."
                    value={stashMessage}
                    onChange={e => setStashMessage(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveStash}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow flex items-center gap-1"
                  >
                    <Archive className="w-3.5 h-3.5" /> Stash
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Stashes ({stashes.length})
                </span>
                {stashes.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 italic">No stashes found.</div>
                ) : (
                  stashes.map((s, idx) => (
                    <div
                      key={s.index}
                      className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="truncate flex-1">
                        <div className="font-medium text-slate-200 truncate">{s.message || `stash@{${s.index}}`}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.branch}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleApplyStash(idx, true)}
                          className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors text-[11px]"
                        >
                          Pop
                        </button>
                        <button
                          onClick={async () => {
                            await GitWorkflowService.dropStash(`stash@{${idx}}`);
                            GitWorkflowService.getStashes().then(setStashes);
                          }}
                          className="p-1 hover:text-rose-400 text-slate-500"
                          title="Drop stash"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TAGS */}
          {activeTab === 'tags' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Create Tag</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="v1.0.0..."
                    value={tagName}
                    onChange={e => setTagName(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={async () => {
                      if (!tagName.trim()) return;
                      await GitWorkflowService.createTag(tagName.trim());
                      setTagName('');
                      GitWorkflowService.getTags().then(setTags);
                      showToast(`Created tag ${tagName}`, 'success');
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow"
                  >
                    Tag
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tags ({tags.length})
                </span>
                {tags.map(t => (
                  <div
                    key={t.name}
                    className="p-2 bg-slate-800/40 rounded border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-indigo-300">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{t.commitHash.slice(0, 7)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: .GITIGNORE ASSISTANT */}
          {activeTab === 'ignore' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <FileX className="w-4 h-4" />
                <span>Ignore-File Assistant</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Quickly populate your <code className="text-slate-200">.gitignore</code> file with industry-standard rules for common environments.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleAddGitignorePreset('node')}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
                >
                  <span className="font-bold text-slate-200">Node & npm</span>
                  <span className="text-[10px] text-slate-400 font-mono">node_modules/, *.log</span>
                </button>

                <button
                  onClick={() => handleAddGitignorePreset('env')}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
                >
                  <span className="font-bold text-slate-200">Environment</span>
                  <span className="text-[10px] text-slate-400 font-mono">.env, .env.*</span>
                </button>

                <button
                  onClick={() => handleAddGitignorePreset('build')}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
                >
                  <span className="font-bold text-slate-200">Build Output</span>
                  <span className="text-[10px] text-slate-400 font-mono">dist/, build/, .output/</span>
                </button>

                <button
                  onClick={() => handleAddGitignorePreset('os')}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
                >
                  <span className="font-bold text-slate-200">OS Artifacts</span>
                  <span className="text-[10px] text-slate-400 font-mono">.DS_Store, Thumbs.db</span>
                </button>
              </div>

              <button
                onClick={() => openFile('.gitignore')}
                className="mt-2 py-2 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Open .gitignore in Editor</span>
              </button>
            </div>
          )}

          {/* TAB 7: GITHUB INTEGRATION */}
          {activeTab === 'github' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Github className="w-4 h-4 text-white" />
                  <span>GitHub Integration</span>
                </div>
                {gitHubAuthed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Connected
                  </span>
                )}
              </div>

              {!gitHubAuthed ? (
                <div className="flex flex-col gap-2.5 bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Authenticate with a GitHub Personal Access Token (classic or fine-grained with <code className="text-indigo-300">repo</code> scope) to inspect PRs, view issues, and create pull requests.
                  </p>
                  <input
                    type="password"
                    placeholder="ghp_... (never logged or persisted to disk)"
                    value={gitHubTokenInput}
                    onChange={e => setGitHubTokenInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleSaveGitHubToken}
                    className="py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow text-xs transition-colors"
                  >
                    Authenticate with GitHub
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* User Profile */}
                  <div className="flex items-center gap-2.5 p-2 bg-slate-800/60 rounded-lg border border-slate-700">
                    {gitHubUser?.avatarUrl ? (
                      <img src={gitHubUser.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                        {gitHubUser?.login?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-bold text-white leading-tight">{gitHubUser?.login}</div>
                      <div className="text-[10px] text-slate-400">{gitHubUser?.name || 'GitHub User'}</div>
                    </div>
                  </div>

                  {/* Target Repo Config */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="owner (e.g. facebook)"
                      value={gitHubOwner}
                      onChange={e => setGitHubOwner(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="repo (e.g. react)"
                      value={gitHubRepo}
                      onChange={e => setGitHubRepo(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Pull Requests */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Pull Requests ({pullRequests.length})
                      </span>
                      <button
                        onClick={() => setIsCreatingPr(!isCreatingPr)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        {isCreatingPr ? 'Cancel' : '+ New PR'}
                      </button>
                    </div>

                    {isCreatingPr && (
                      <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="PR Title..."
                          value={prTitle}
                          onChange={e => setPrTitle(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                        <textarea
                          placeholder="PR Description / Summary..."
                          value={prBody}
                          onChange={e => setPrBody(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white h-16 resize-none"
                        />
                        <button
                          onClick={handleCreatePullRequest}
                          className="py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                        >
                          Submit Pull Request
                        </button>
                      </div>
                    )}

                    {pullRequests.map(pr => (
                      <a
                        key={pr.number}
                        href={pr.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded bg-slate-800/40 border border-slate-700 hover:border-slate-500 flex flex-col gap-1 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200 line-clamp-1">
                            #{pr.number} {pr.title}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>by {pr.author?.login}</span>
                          <span>•</span>
                          <span className="font-mono">{pr.headBranch} → {pr.baseBranch}</span>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Issues */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Issues ({issues.length})
                    </span>
                    {issues.map(issue => (
                      <a
                        key={issue.number}
                        href={issue.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded bg-slate-800/40 border border-slate-700 hover:border-slate-500 flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="truncate flex-1 text-slate-300">
                          #{issue.number} {issue.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
