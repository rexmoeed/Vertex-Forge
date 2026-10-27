import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fsPromises from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { serverLogger } from '../../logger';
import { AppError, ValidationError, UnauthorizedError } from '../../errors';
import { execAsync, callGitHubApi, getSessionGitHubToken, setSessionGitHubToken } from './git.utils';

export function createGitRemoteRouter(getAiClient: () => GoogleGenAI | null): Router {
  const router = Router();

  // Remotes list
  router.post('/api/git/remotes', async (req: Request, res: Response) => {
    const { cwd } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      const { stdout } = await execAsync('git remote -v', { cwd: targetCwd });
      const lines = stdout.split('\n').filter(Boolean);
      const remotesMap: Record<string, { name: string; fetchUrl: string; pushUrl: string }> = {};

      for (const line of lines) {
        const match = line.match(/^([^\s]+)\s+([^\s]+)\s+\((fetch|push)\)$/);
        if (match) {
          const [, name, url, type] = match;
          if (!remotesMap[name]) {
            remotesMap[name] = { name, fetchUrl: url, pushUrl: url };
          }
          if (type === 'fetch') remotesMap[name].fetchUrl = url;
          if (type === 'push') remotesMap[name].pushUrl = url;
        }
      }
      return res.json({ remotes: Object.values(remotesMap) });
    } catch {
      return res.json({ remotes: [] });
    }
  });

  // Add remote
  router.post('/api/git/remote/add', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, name, url } = req.body;
    if (!name || !url) return next(new ValidationError('Remote name and URL are required'));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      await execAsync(`git remote add "${name}" "${url}"`, { cwd: targetCwd });
      return res.json({ success: true });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Add remote failed');
      return next(new AppError(err?.message || 'Add remote failed', 500, 'GIT_REMOTE_ADD_ERROR'));
    }
  });

  // Remove remote
  router.post('/api/git/remote/remove', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, name } = req.body;
    if (!name) return next(new ValidationError('Remote name is required'));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      await execAsync(`git remote remove "${name}"`, { cwd: targetCwd });
      return res.json({ success: true });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Remove remote failed');
      return next(new AppError(err?.message || 'Remove remote failed', 500, 'GIT_REMOTE_REMOVE_ERROR'));
    }
  });

  // Fetch
  router.post('/api/git/fetch', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, remote = 'origin' } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      const { stdout, stderr } = await execAsync(`git fetch "${remote}"`, { cwd: targetCwd, timeout: 30000 });
      return res.json({ success: true, output: stdout || stderr });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git fetch failed');
      return next(new AppError(err?.message || 'Git fetch failed', 500, 'GIT_FETCH_ERROR'));
    }
  });

  // Pull
  router.post('/api/git/pull', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, remote = 'origin', branch } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    const branchArg = branch ? ` "${branch}"` : '';

    try {
      const { stdout, stderr } = await execAsync(`git pull "${remote}"${branchArg}`, { cwd: targetCwd, timeout: 60000 });
      return res.json({ success: true, output: stdout || stderr });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git pull failed');
      return next(new AppError(err?.message || 'Git pull failed', 500, 'GIT_PULL_ERROR'));
    }
  });

  // Push
  router.post('/api/git/push', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, remote = 'origin', branch, force = false } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    const branchArg = branch ? ` "${branch}"` : '';
    const forceFlag = force ? ' --force-with-lease' : '';

    try {
      const { stdout, stderr } = await execAsync(`git push${forceFlag} "${remote}"${branchArg}`, { cwd: targetCwd, timeout: 60000 });
      return res.json({ success: true, output: stdout || stderr });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git push failed');
      return next(new AppError(err?.message || 'Git push failed', 500, 'GIT_PUSH_ERROR'));
    }
  });

  // Clone
  router.post('/api/git/clone', async (req: Request, res: Response, next: NextFunction) => {
    const { repoUrl, targetDir } = req.body;
    if (!repoUrl) return next(new ValidationError('repoUrl is required'));

    const targetPath = targetDir ? path.resolve(targetDir) : path.resolve(process.cwd(), 'cloned-repo-' + Date.now());

    try {
      await fsPromises.mkdir(path.dirname(targetPath), { recursive: true });
      const { stdout, stderr } = await execAsync(`git clone "${repoUrl}" "${targetPath}"`, {
        timeout: 120000,
      });

      return res.json({
        success: true,
        targetPath,
        name: path.basename(targetPath),
        output: stdout || stderr,
      });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git clone failed');
      return next(new AppError(err?.message || 'Git clone failed', 500, 'GIT_CLONE_ERROR'));
    }
  });

  // GitHub Auth Status
  router.get('/api/github/auth-status', async (req: Request, res: Response) => {
    const token = getSessionGitHubToken() || process.env.GITHUB_TOKEN;
    if (!token) {
      return res.json({ authenticated: false });
    }

    try {
      const user = await callGitHubApi('/user');
      return res.json({ authenticated: true, user: { login: user.login, name: user.name, avatarUrl: user.avatar_url } });
    } catch {
      return res.json({ authenticated: false, error: 'Token invalid or expired' });
    }
  });

  // GitHub Set Token
  router.post('/api/github/set-token', async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;
    const cleanToken = (token || '').trim();
    setSessionGitHubToken(cleanToken);

    if (!cleanToken) {
      return res.json({ authenticated: false });
    }

    try {
      const user = await callGitHubApi('/user');
      return res.json({ authenticated: true, user: { login: user.login, name: user.name, avatarUrl: user.avatar_url } });
    } catch {
      setSessionGitHubToken('');
      return next(new UnauthorizedError('Invalid GitHub token. Ensure token has repo scope.'));
    }
  });

  // GitHub Repo Info
  router.post('/api/github/repo', async (req: Request, res: Response, next: NextFunction) => {
    const { owner, repo } = req.body;
    if (!owner || !repo) return next(new ValidationError('owner and repo are required'));

    try {
      const data = await callGitHubApi(`/repos/${owner}/${repo}`);
      return res.json({
        owner: data.owner?.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        isPrivate: data.private,
        defaultBranch: data.default_branch,
        htmlUrl: data.html_url,
      });
    } catch (err: any) {
      return next(err);
    }
  });

  // GitHub Pulls
  router.post('/api/github/pulls', async (req: Request, res: Response, next: NextFunction) => {
    const { owner, repo, state = 'open' } = req.body;
    if (!owner || !repo) return next(new ValidationError('owner and repo are required'));

    try {
      const pulls = await callGitHubApi(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=20`);
      return res.json({
        pulls: pulls.map((p: any) => ({
          number: p.number,
          title: p.title,
          body: p.body || '',
          state: p.state,
          author: { login: p.user?.login, avatarUrl: p.user?.avatar_url },
          headBranch: p.head?.ref,
          baseBranch: p.base?.ref,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          htmlUrl: p.html_url,
          labels: p.labels?.map((l: any) => ({ name: l.name, color: l.color })) || [],
        })),
      });
    } catch {
      return res.json({ pulls: [] });
    }
  });

  // GitHub Create Pull
  router.post('/api/github/pull/create', async (req: Request, res: Response, next: NextFunction) => {
    const { owner, repo, title, body, head, base } = req.body;
    if (!owner || !repo || !title || !head || !base) {
      return next(new ValidationError('owner, repo, title, head, base are required'));
    }

    try {
      const pr = await callGitHubApi(`/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify({ title, body, head, base }),
      });
      return res.json({ success: true, pullRequest: pr });
    } catch (err: any) {
      return next(err);
    }
  });

  // GitHub Issues
  router.post('/api/github/issues', async (req: Request, res: Response, next: NextFunction) => {
    const { owner, repo, state = 'open' } = req.body;
    if (!owner || !repo) return next(new ValidationError('owner and repo are required'));

    try {
      const issues = await callGitHubApi(`/repos/${owner}/${repo}/issues?state=${state}&per_page=20`);
      const filtered = issues.filter((i: any) => !i.pull_request).map((i: any) => ({
        number: i.number,
        title: i.title,
        body: i.body || '',
        state: i.state,
        author: { login: i.user?.login, avatarUrl: i.user?.avatar_url },
        createdAt: i.created_at,
        labels: i.labels?.map((l: any) => ({ name: l.name, color: l.color })) || [],
        commentsCount: i.comments,
        htmlUrl: i.html_url,
      }));
      return res.json({ issues: filtered });
    } catch {
      return res.json({ issues: [] });
    }
  });

  // AI Git Assistant
  router.post('/api/ai/git-assistant', async (req: Request, res: Response) => {
    const { task, diff } = req.body;

    const ai = getAiClient();
    if (!ai) {
      if (task === 'commit-message') {
        return res.json({ suggestedCommitMessage: 'feat: update workspace components and services' });
      }
      return res.json({ summary: 'Diff contains code changes across workspace.' });
    }

    try {
      if (task === 'commit-message') {
        const response: any = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an expert Git software engineer. Generate a concise Conventional Commit message based on the following diff:\n\n${(diff || '').slice(0, 4000)}`,
        });
        const suggestedCommitMessage = response.text?.trim().replace(/^`+|`+$/g, '') || 'chore: update workspace files';
        return res.json({ suggestedCommitMessage });
      }

      if (task === 'explain-diff') {
        const response: any = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Explain the following code diff clearly and concisely in 2-3 short bullet points, highlighting key behavioral changes:\n\n${(diff || '').slice(0, 6000)}`,
        });
        return res.json({ summary: response.text?.trim() || 'No explanation available.' });
      }

      if (task === 'review-changes') {
        const response: any = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Review the following code diff for potential bugs, security vulnerabilities, or regressions. Return concise findings:\n\n${(diff || '').slice(0, 6000)}`,
        });
        return res.json({ review: response.text?.trim() || 'No issues detected.' });
      }

      return res.json({ success: true });
    } catch {
      return res.json({
        suggestedCommitMessage: 'feat: update project codebase and verify tests',
        summary: 'Diff review generated by fallback analyzer.',
      });
    }
  });

  return router;
}
