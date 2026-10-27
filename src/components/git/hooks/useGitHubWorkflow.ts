import { useState } from 'react';
import { GitHubPullRequest, GitHubIssue } from '../../../types/gitWorkflow';
import { GitWorkflowService } from '../../../services/gitWorkflowService';
import { logger } from '../../../services/logger';

export function useGitHubWorkflow(
  showToast: (text: string, type?: 'info' | 'error' | 'success') => void
) {
  const [gitHubAuthed, setGitHubAuthed] = useState(false);
  const [gitHubUser, setGitHubUser] = useState<any>(null);
  const [gitHubOwner, setGitHubOwner] = useState('');
  const [gitHubRepo, setGitHubRepo] = useState('');
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);

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

  const handleCreatePR = async (title: string, body: string, base: string, currentBranch: string) => {
    if (!gitHubOwner || !gitHubRepo) return;
    try {
      const res = await GitWorkflowService.createGitHubPullRequest({
        owner: gitHubOwner,
        repo: gitHubRepo,
        title,
        body,
        head: currentBranch,
        base,
      });
      showToast(`Pull request created #${res.number}`, 'success');
      if (gitHubOwner && gitHubRepo) {
        GitWorkflowService.getGitHubPullRequests(gitHubOwner, gitHubRepo).then(setPullRequests);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      showToast(`Failed to create PR: ${msg}`, 'error');
      logger.error('Failed to create GitHub pull request', { owner: gitHubOwner, repo: gitHubRepo }, e);
    }
  };

  return {
    gitHubAuthed,
    setGitHubAuthed,
    gitHubUser,
    setGitHubUser,
    gitHubOwner,
    setGitHubOwner,
    gitHubRepo,
    setGitHubRepo,
    pullRequests,
    setPullRequests,
    issues,
    setIssues,
    handleSaveGitHubToken,
    handleUpdateGitHubRepo,
    handleCreatePR,
  };
}
