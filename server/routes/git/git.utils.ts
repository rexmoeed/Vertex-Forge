import util from 'util';
import { exec } from 'child_process';
import { UpstreamApiError } from '../../errors';

export const execAsync = util.promisify(exec);

let sessionGitHubToken: string = process.env.GITHUB_TOKEN || '';

export function getSessionGitHubToken(): string {
  return sessionGitHubToken;
}

export function setSessionGitHubToken(token: string): void {
  sessionGitHubToken = token;
}

export async function callGitHubApi(endpoint: string, options: any = {}) {
  const token = sessionGitHubToken || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'VertexForge-GitIntegration',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new UpstreamApiError('GitHub API', `Status ${res.status}: ${errorText}`);
  }
  return await res.json();
}
