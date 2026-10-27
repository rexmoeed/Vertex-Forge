import { useState } from 'react';
import { GitBranch, GitStash, GitTag, GitWorkingTreeStatus } from '../../../types/gitWorkflow';
import { GitWorkflowService } from '../../../services/gitWorkflowService';
import { logger } from '../../../services/logger';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  severity: 'danger' | 'warning' | 'info';
  action: () => Promise<void>;
}

export function useGitBranchStashWorkflow(
  status: GitWorkingTreeStatus,
  loadAll: () => void,
  refreshGit?: () => void,
  showToast?: (text: string, type?: 'info' | 'error' | 'success') => void,
  setConfirmDialog?: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>,
  setIsConflictModalOpen?: (isOpen: boolean) => void
) {
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [stashes, setStashes] = useState<GitStash[]>([]);
  const [tags, setTags] = useState<GitTag[]>([]);

  const handleCreateBranch = async (name: string) => {
    if (!name.trim()) return;
    const res = await GitWorkflowService.createBranch(name.trim(), true);
    if (res.success) {
      showToast?.(`Created & checked out branch "${name.trim()}"`, 'success');
      loadAll();
      GitWorkflowService.getBranches().then(setBranches);
    } else {
      showToast?.(res.error || 'Failed to create branch', 'error');
    }
  };

  const handleCheckoutBranch = async (branchName: string) => {
    const res = await GitWorkflowService.checkoutBranch(branchName);
    if (res.success) {
      showToast?.(`Switched to branch "${branchName}"`, 'success');
      loadAll();
      GitWorkflowService.getBranches().then(setBranches);
      refreshGit?.();
    } else {
      showToast?.(res.error || 'Failed to switch branch', 'error');
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (branchName === status.branch) {
      showToast?.('Cannot delete the currently active branch', 'error');
      return;
    }
    setConfirmDialog?.({
      isOpen: true,
      title: 'Delete Branch',
      message: `Safety Warning: Delete branch "${branchName}"? This branch will be removed from your local repository.`,
      confirmText: 'Delete Branch',
      severity: 'danger',
      action: async () => {
        const res = await GitWorkflowService.deleteBranch(branchName);
        if (res.success) {
          showToast?.(`Deleted branch "${branchName}"`, 'info');
          GitWorkflowService.getBranches().then(setBranches);
        } else {
          showToast?.(res.error || 'Failed to delete branch', 'error');
        }
      },
    });
  };

  const handleSaveStash = async (msg?: string) => {
    const ok = await GitWorkflowService.saveStash(msg || undefined);
    if (ok) {
      showToast?.('Changes stashed', 'success');
      loadAll();
      GitWorkflowService.getStashes().then(setStashes);
      refreshGit?.();
    } else {
      showToast?.('Failed to save stash', 'error');
    }
  };

  const handleApplyStash = async (index = 0, pop = false) => {
    const ok = await GitWorkflowService.applyStash(`stash@{${index}}`, pop);
    if (ok) {
      showToast?.(pop ? 'Popped stash' : 'Applied stash', 'success');
      loadAll();
      GitWorkflowService.getStashes().then(setStashes);
      refreshGit?.();
    } else {
      showToast?.('Failed to apply stash', 'error');
    }
  };

  const handleDropStash = async (index: number) => {
    await GitWorkflowService.dropStash(`stash@{${index}}`);
    GitWorkflowService.getStashes().then(setStashes);
    showToast?.(`Dropped stash@{${index}}`, 'info');
  };

  const handleCreateTag = async (name: string) => {
    await GitWorkflowService.createTag(name);
    GitWorkflowService.getTags().then(setTags);
    showToast?.(`Created tag "${name}"`, 'success');
  };

  const handleDeleteTag = async (name: string) => {
    await GitWorkflowService.deleteTag(name);
    GitWorkflowService.getTags().then(setTags);
    showToast?.(`Deleted tag "${name}"`, 'info');
  };

  const handleCherryPick = async (hash: string) => {
    const res = await GitWorkflowService.cherryPick(hash);
    if (res.success) {
      showToast?.(`Cherry-picked commit ${hash.slice(0, 7)}`, 'success');
      loadAll();
      refreshGit?.();
    } else {
      showToast?.(res.error || 'Cherry-pick failed', 'error');
    }
  };

  const handleRevert = async (hash: string) => {
    setConfirmDialog?.({
      isOpen: true,
      title: 'Revert Commit',
      message: `Safety Warning: Create revert commit for ${hash.slice(0, 7)}?`,
      confirmText: 'Revert Commit',
      severity: 'warning',
      action: async () => {
        const res = await GitWorkflowService.revertCommit(hash);
        if (res.success) {
          showToast?.(`Reverted commit ${hash.slice(0, 7)}`, 'success');
          loadAll();
          refreshGit?.();
        } else {
          showToast?.(res.error || 'Revert failed', 'error');
        }
      },
    });
  };

  const handleMergeBranch = async (sourceBranch: string) => {
    const res = await GitWorkflowService.merge(sourceBranch);
    if (res.success) {
      showToast?.(`Merged ${sourceBranch}`, 'success');
      loadAll();
      refreshGit?.();
    } else {
      setIsConflictModalOpen?.(true);
    }
  };

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
      showToast?.(`Added ${type} rules to .gitignore`, 'success');
      loadAll();
      refreshGit?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      showToast?.(`Failed to update .gitignore: ${msg}`, 'error');
      logger.error('Failed to update .gitignore preset', { type }, e);
    }
  };

  return {
    branches,
    setBranches,
    stashes,
    setStashes,
    tags,
    setTags,
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
    handleMergeBranch,
    handleAddGitignorePreset,
  };
}
