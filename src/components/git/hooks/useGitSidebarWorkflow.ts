import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../../services/logger';
import {
  GitWorkingTreeStatus,
  GitBranch as GitBranchType,
  GitCommitInfo,
  GitRemote,
  GitTag as GitTagType,
  GitStash,
  GitHubPullRequest,
  GitHubIssue,
} from '../../../types/gitWorkflow';
import { GitWorkflowService } from '../../../services/gitWorkflowService';
import { useIDE } from '../../../context/IDEContext';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  severity: 'danger' | 'warning' | 'info';
  action: () => Promise<void> | void;
}

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

  // Commits / History / Branches / Remotes / Tags / Stashes
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

  // In-app confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    severity: 'warning',
    action: () => {},
  });

  const showToast = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

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

  // GitHub handlers
  const handleSaveGitHubToken = async (token: string) => {
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
  };

  const handleUpdateGitHubRepo = (owner: string, repo: string) => {
    setGitHubOwner(owner);
    setGitHubRepo(repo);
    if (gitHubAuthed && owner && repo) {
      GitWorkflowService.getGitHubPullRequests(owner, repo).then(setPullRequests);
      GitWorkflowService.getGitHubIssues(owner, repo).then(setIssues);
    }
  };

  const handleCreatePR = async (title: string, body: string, base: string) => {
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
  };

  const handleMergeBranch = async (sourceBranch: string) => {
    const res = await GitWorkflowService.merge(sourceBranch);
    if (res.success) {
      showToast(`Merged ${sourceBranch}`, 'success');
      loadAll();
      refreshGit?.();
    } else {
      setIsConflictModalOpen(true);
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
    branches,
    remotes,
    tags,
    stashes,
    isConflictModalOpen,
    setIsConflictModalOpen,
    aiLoading,
    aiReviewResult,
    setAiReviewResult,
    gitHubAuthed,
    gitHubUser,
    gitHubOwner,
    setGitHubOwner,
    gitHubRepo,
    setGitHubRepo,
    pullRequests,
    issues,
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
    handleCreateBranch,
    handleCheckoutBranch,
    handleDeleteBranch,
    handleSaveStash,
    handleApplyStash,
    handleDropStash,
    handleCreateTag,
    handleDeleteTag,
    handleCherryPick,
    handleRevert,
    handleAddGitignorePreset,
    handleSaveGitHubToken,
    handleUpdateGitHubRepo,
    handleCreatePR,
    handleMergeBranch,
  };
}
