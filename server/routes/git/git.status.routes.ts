import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { serverLogger } from '../../logger';
import { AppError } from '../../errors';
import { execAsync } from './git.utils';

export function createGitStatusRouter(): Router {
  const router = Router();

  // Git Init
  router.post('/api/git/init', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      const { stdout } = await execAsync('git init && git branch -M main', { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git init failed');
      return next(new AppError(err?.message || 'Git init failed', 500, 'GIT_INIT_ERROR'));
    }
  });

  // Git Status (Detailed porcelain v1)
  router.post('/api/git/status', async (req: Request, res: Response) => {
    const { cwd } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      const { stdout: statusOut } = await execAsync('git status --porcelain=v1 -b -uall', { cwd: targetCwd });
      const lines = statusOut.split('\n').filter(Boolean);

      let branch = 'main';
      let upstream: string | undefined = undefined;
      let ahead = 0;
      let behind = 0;
      let isDetached = false;

      const staged: any[] = [];
      const unstaged: any[] = [];
      const untracked: any[] = [];
      const conflicted: any[] = [];

      for (const line of lines) {
        if (line.startsWith('## ')) {
          const branchHeader = line.slice(3);
          if (branchHeader.includes('HEAD (no branch)') || branchHeader.startsWith('No commits yet on ')) {
            if (branchHeader.startsWith('No commits yet on ')) {
              branch = branchHeader.replace('No commits yet on ', '').trim();
            } else {
              isDetached = true;
              branch = 'HEAD (detached)';
            }
          } else {
            const match = branchHeader.match(/^([^.]+)/);
            if (match) branch = match[1].trim();

            const upstreamMatch = branchHeader.match(/\.\.\.([^\s]+)/);
            if (upstreamMatch) upstream = upstreamMatch[1];

            if (branchHeader.includes('ahead ')) {
              const m = branchHeader.match(/ahead (\d+)/);
              if (m) ahead = Number(m[1]);
            }
            if (branchHeader.includes('behind ')) {
              const m = branchHeader.match(/behind (\d+)/);
              if (m) behind = Number(m[1]);
            }
          }
        } else {
          const indexStatus = line[0];
          const workTreeStatus = line[1];
          const filePath = line.slice(3).trim();

          if (
            (indexStatus === 'U' || workTreeStatus === 'U') ||
            (indexStatus === 'A' && workTreeStatus === 'A') ||
            (indexStatus === 'D' && workTreeStatus === 'D')
          ) {
            conflicted.push({ filePath, status: 'conflicted', staged: false });
          } else {
            if (indexStatus !== ' ' && indexStatus !== '?') {
              const status = indexStatus === 'M' ? 'modified' : indexStatus === 'A' ? 'added' : indexStatus === 'D' ? 'deleted' : indexStatus === 'R' ? 'renamed' : 'modified';
              staged.push({ filePath, status, staged: true });
            }

            if (workTreeStatus === 'M') {
              unstaged.push({ filePath, status: 'modified', staged: false });
            } else if (workTreeStatus === 'D') {
              unstaged.push({ filePath, status: 'deleted', staged: false });
            } else if (indexStatus === '?' && workTreeStatus === '?') {
              untracked.push({ filePath, status: 'untracked', staged: false });
            }
          }
        }
      }

      let lastCommit = undefined;
      try {
        const { stdout: logOut } = await execAsync('git log -1 --pretty=format:"%H|%h|%s|%an|%cr"', { cwd: targetCwd });
        const [hash, shortHash, message, author, timestamp] = logOut.split('|');
        if (hash) {
          lastCommit = { hash, shortHash, message, author, timestamp };
        }
      } catch {
        // ignore
      }

      return res.json({
        isRepo: true,
        branch,
        upstream,
        ahead,
        behind,
        isDetached,
        staged,
        unstaged,
        untracked,
        conflicted,
        hasConflicts: conflicted.length > 0,
        lastCommit,
        modifiedCount: unstaged.length + staged.length + untracked.length,
        stagedCount: staged.length,
        untrackedCount: untracked.length,
      });
    } catch {
      return res.json({
        isRepo: false,
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
    }
  });

  // Git Diff
  router.post('/api/git/diff', async (req: Request, res: Response) => {
    const { cwd, filePath, staged } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    const fileArg = filePath ? ` -- "${filePath}"` : '';
    const stagedArg = staged ? ' --cached' : '';

    try {
      const { stdout } = await execAsync(`git diff${stagedArg}${fileArg}`, { cwd: targetCwd, maxBuffer: 10 * 1024 * 1024 });
      return res.json({ diff: stdout || '' });
    } catch {
      return res.json({ diff: '' });
    }
  });

  // Git Log
  router.post('/api/git/log', async (req: Request, res: Response) => {
    const { cwd, maxCount = 50 } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      const { stdout } = await execAsync(
        `git log -n ${Number(maxCount)} --pretty=format:"%H|%h|%s|%an|%ae|%aI|%cr|%d"`,
        { cwd: targetCwd }
      );
      const lines = stdout.split('\n').filter(Boolean);
      const commits = lines.map((line, idx) => {
        const [hash, shortHash, message, author, email, timestamp, relativeTime, refNames] = line.split('|');
        return {
          hash,
          shortHash,
          message,
          author,
          email,
          timestamp,
          relativeTime,
          isHead: idx === 0,
          refNames: refNames?.trim() || '',
        };
      });
      return res.json({ commits });
    } catch {
      return res.json({ commits: [] });
    }
  });

  return router;
}
