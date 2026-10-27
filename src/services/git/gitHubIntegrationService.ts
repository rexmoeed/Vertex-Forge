import {
  GitHubRepoParamsSchema,
  GitHubPullRequestParamsSchema,
} from '../../schemas/gitHubIntegration.schema';
import { GitHubRepoInfo, GitHubPullRequest, GitHubIssue } from '../../types/gitWorkflow';

export class GitHubIntegrationService {
  public static async getGitHubAuthStatus(): Promise<{ authenticated: boolean; user?: any; error?: string }> {
    try {
      const res = await fetch('/api/github/auth-status');
      if (res.ok) return await res.json();
    } catch {}
    return { authenticated: false };
  }

  public static async setGitHubToken(token: string): Promise<{ authenticated: boolean; user?: any; error?: string }> {
    try {
      const res = await fetch('/api/github/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return await res.json();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { authenticated: false, error: msg };
    }
  }

  public static async getGitHubRepo(owner: string, repo: string): Promise<GitHubRepoInfo | null> {
    GitHubRepoParamsSchema.parse({ owner, repo });
    try {
      const res = await fetch('/api/github/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  public static async getGitHubPullRequests(
    owner: string,
    repo: string,
    state = 'open'
  ): Promise<GitHubPullRequest[]> {
    GitHubPullRequestParamsSchema.parse({ owner, repo, state: state as any });
    try {
      const res = await fetch('/api/github/pulls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, state }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.pulls || [];
      }
    } catch {}
    return [];
  }

  public static async createGitHubPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<any> {
    const res = await fetch('/api/github/pull/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  }

  public static async getGitHubIssues(owner: string, repo: string, state = 'open'): Promise<GitHubIssue[]> {
    try {
      const res = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, state }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.issues || [];
      }
    } catch {}
    return [];
  }
}
