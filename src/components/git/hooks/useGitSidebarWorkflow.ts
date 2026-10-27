import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../../services/logger';
import {
  GitWorkingTreeStatus,
  GitCommitInfo,
  GitRemote,
} from '../../../types/gitWorkflow';
import { GitWorkflowService } from '../../../services/gitWorkflowService';
import { useIDE } from '../../../context/IDEContext';
import { useGitHubWorkflow } from './useGitHubWorkflow';
import { useGitBranchStashWorkflow, ConfirmDialogState } from './useGitBranchStashWorkflow';

export type { ConfirmDialogState };
export type GitActiveTab = 'changes' | 'history' | 'branches' | 'stashes' | 'tags' | 'ignore' | 'github';

export function useGitSidebarWorkflow() {
  const { refreshGit } = useIDE();

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

  // Bottom drawer tab
  const [activeTab, setActiveTab] = useState<GitActiveTab>('changes');

  // Commits & Remotes
  const [commits, setCommits] = useState<GitCommitInfo[]>([]);
  const [remotes, setRemotes] = useState<GitRemote[]>([]);

  // Modals & secondary state
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // AI assistant states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  // In-app confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    severity: 'warning',
    action: async () => {},
  });

  const showToast = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // GitHub sub-hook
  const github = useGitHubWorkflow(showToast);

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
        if (match && !github.gitHubOwner) {
          github.setGitHubOwner(match[1]);
          github.setGitHubRepo(match[2]);
        }
      }
    } catch (e: unknown) {
      logger.warn('Error loading Git status', { owner: github.gitHubOwner }, e);
    } finally {
      setLoading(false);
    }
  }, [github]);

  // Branch & Stash sub-hook
  const branchStash = useGitBranchStashWorkflow(
    status,
    loadAll,
    refreshGit,
    showToast,
    setConfirmDialog,
    setIsConflictModalOpen
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Load secondary data when tabs change
  useEffect(() => {
    if (activeTab === 'history') {
      GitWorkflowService.getLog(40).then(setCommits);
    } else if (activeTab === 'branches') {
      GitWorkflowService.getBranches().then(branchStash.setBranches);
      GitWorkflowService.getRemotes().then(setRemotes);
    } else if (activeTab === 'stashes') {
      GitWorkflowService.getStashes().then(branchStash.setStashes);
    } else if (activeTab === 'tags') {
      GitWorkflowService.getTags().then(branchStash.setTags);
    } else if (activeTab === 'github') {
      GitWorkflowService.getGitHubAuthStatus().then(res => {
        github.setGitHubAuthed(res.authenticated);
        github.setGitHubUser(res.user);
        if (res.authenticated && github.gitHubOwner && github.gitHubRepo) {
          GitWorkflowService.getGitHubPullRequests(github.gitHubOwner, github.gitHubRepo).then(github.setPullRequests);
          GitWorkflowService.getGitHubIssues(github.gitHubOwner, github.gitHubRepo).then(github.setIssues);
        }
      });
    }
  }, [activeTab, github, branchStash]);

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

  const totalChanges = status.staged.length + status.unstaged.length + status.untracked.length;

  return {
    status,
    loading,
    commitMessage,
    setCommitMessage,
    amend,
    setAmend,
    isCommitting,
    activeTab,
    setActiveTab,
    commits,
    setCommits,
    branches: branchStash.branches,
    remotes,
    tags: branchStash.tags,
    stashes: branchStash.stashes,
    isConflictModalOpen,
    setIsConflictModalOpen,
    aiLoading,
    aiReviewResult,
    setAiReviewResult,
    gitHubAuthed: github.gitHubAuthed,
    gitHubUser: github.gitHubUser,
    gitHubOwner: github.gitHubOwner,
    setGitHubOwner: github.setGitHubOwner,
    gitHubRepo: github.gitHubRepo,
    setGitHubRepo: github.setGitHubRepo,
    pullRequests: github.pullRequests,
    issues: github.issues,
    notification,
    setNotification,
    confirmDialog,
    setConfirmDialog,
    totalChanges,
    showToast,
    loadAll,
    handleInitRepo,
    handleStage,
    handleStageAll,
    handleUnstage,
    handleUnstageAll,
    handleDiscard,
    handleDiscardAll,
    handleCommit,
    handleFetch,
    handlePull,
    handlePush,
    handleSuggestCommitMessage,
    handleReviewWithAI,
    handleCreateBranch: branchStash.handleCreateBranch,
    handleCheckoutBranch: branchStash.handleCheckoutBranch,
    handleDeleteBranch: branchStash.handleDeleteBranch,
    handleSaveStash: branchStash.handleSaveStash,
    handleApplyStash: branchStash.handleApplyStash,
    handleDropStash: branchStash.handleDropStash,
    handleCreateTag: branchStash.handleCreateTag,
    handleDeleteTag: branchStash.handleDeleteTag,
    handleCherryPick: branchStash.handleCherryPick,
    handleRevert: branchStash.handleRevert,
    handleAddGitignorePreset: branchStash.handleAddGitignorePreset,
    handleSaveGitHubToken: github.handleSaveGitHubToken,
    handleUpdateGitHubRepo: github.handleUpdateGitHubRepo,
    handleCreatePR: (title: string, body: string, base: string) =>
      github.handleCreatePR(title, body, base, status.branch),
    handleMergeBranch: branchStash.handleMergeBranch,
  };
}
