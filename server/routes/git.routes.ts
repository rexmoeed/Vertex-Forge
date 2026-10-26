import { serverLogger } from '../logger';
import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { validateBody, CommonSchemas } from '../middleware/validation';

const execAsync = util.promisify(exec);

let sessionGitHubToken: string = process.env.GITHUB_TOKEN || '';

async function callGitHubApi(endpoint: string, options: any = {}) {
  const token = sessionGitHubToken || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
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
    throw new Error(`GitHub API error (${res.status}): ${errorText}`);
  }
  return await res.json();
}

// 13. Real Git Init

export function createGitRouter(getAiClient: () => GoogleGenAI | null): Router {
  const router = Router();

router.post('/api/git/init', async (req: Request, res: Response) => {
  const { cwd } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const { stdout } = await execAsync('git init && git branch -M main', { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git init failed');
    return res.status(500).json({ error: err?.message || 'Git init failed' });
  }
});

// 14. Real Git Status (Detailed porcelain v1)
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

        // Check for merge conflict markers (UU, AA, DD, AU, UA, DU, UD)
        if (
          (indexStatus === 'U' || workTreeStatus === 'U') ||
          (indexStatus === 'A' && workTreeStatus === 'A') ||
          (indexStatus === 'D' && workTreeStatus === 'D')
        ) {
          conflicted.push({ filePath, status: 'conflicted', staged: false });
        } else {
          // Staged changes
          if (indexStatus !== ' ' && indexStatus !== '?') {
            const status = indexStatus === 'M' ? 'modified' : indexStatus === 'A' ? 'added' : indexStatus === 'D' ? 'deleted' : indexStatus === 'R' ? 'renamed' : 'modified';
            staged.push({ filePath, status, staged: true });
          }

          // Unstaged changes in working tree
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

    // Get last commit info
    let lastCommit = undefined;
    try {
      const { stdout: logOut } = await execAsync('git log -1 --pretty=format:"%H|%h|%s|%an|%cr"', { cwd: targetCwd });
      const [hash, shortHash, message, author, timestamp] = logOut.split('|');
      if (hash) {
        lastCommit = { hash, shortHash, message, author, timestamp };
      }
    } catch (e) {
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
  } catch (err: any) {
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

// 15. Real Git Diff (working tree vs index, or staged vs HEAD, or specific file)
router.post('/api/git/diff', async (req: Request, res: Response) => {
  const { cwd, filePath, staged } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  const fileArg = filePath ? ` -- "${filePath}"` : '';
  const stagedArg = staged ? ' --cached' : '';

  try {
    const { stdout } = await execAsync(`git diff${stagedArg}${fileArg}`, { cwd: targetCwd, maxBuffer: 10 * 1024 * 1024 });
    return res.json({ diff: stdout || '' });
  } catch (err: any) {
    return res.json({ diff: '' });
  }
});

// 16. Real Git Stage (single file, all, or patterns)
router.post('/api/git/stage', async (req: Request, res: Response) => {
  const { cwd, filePath = '.' } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    if (filePath === '.' || filePath === '-A') {
      await execAsync('git add -A', { cwd: targetCwd });
    } else {
      await execAsync(`git add "${filePath}"`, { cwd: targetCwd });
    }
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git add failed');
    return res.status(500).json({ error: err?.message || 'Git add failed' });
  }
});

// 17. Real Git Unstage
router.post('/api/git/unstage', async (req: Request, res: Response) => {
  const { cwd, filePath = '.' } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    if (filePath === '.' || filePath === '-A') {
      await execAsync('git restore --staged .', { cwd: targetCwd }).catch(() =>
        execAsync('git reset HEAD', { cwd: targetCwd })
      );
    } else {
      await execAsync(`git restore --staged "${filePath}"`, { cwd: targetCwd }).catch(() =>
        execAsync(`git reset HEAD "${filePath}"`, { cwd: targetCwd })
      );
    }
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git unstage failed');
    return res.status(500).json({ error: err?.message || 'Git unstage failed' });
  }
});

// 18. Real Git Discard / Revert working tree changes
router.post('/api/git/discard', async (req: Request, res: Response) => {
  const { cwd, filePath } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    if (!filePath || filePath === '.') {
      await execAsync('git restore .', { cwd: targetCwd });
    } else {
      await execAsync(`git restore "${filePath}"`, { cwd: targetCwd });
    }
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git discard failed');
    return res.status(500).json({ error: err?.message || 'Git discard failed' });
  }
});

// 19. Real Git Clean Untracked file
router.post('/api/git/clean-untracked', async (req: Request, res: Response) => {
  const { cwd, filePath } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    if (filePath) {
      await execAsync(`git clean -f "${filePath}"`, { cwd: targetCwd });
    } else {
      await execAsync('git clean -fd', { cwd: targetCwd });
    }
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git clean failed');
    return res.status(500).json({ error: err?.message || 'Git clean failed' });
  }
});

// 20. Real Git Commit (with optional amend)
router.post('/api/git/commit', async (req: Request, res: Response) => {
  const { cwd, message, amend = false } = req.body;
  if (!message && !amend) return res.status(400).json({ error: 'Commit message is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const safeMsg = (message || '').replace(/"/g, '\\"');
    const amendFlag = amend ? ' --amend' : '';
    const msgFlag = safeMsg ? ` -m "${safeMsg}"` : ' --no-edit';
    const { stdout } = await execAsync(`git commit${amendFlag}${msgFlag}`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git commit failed');
    return res.status(500).json({ error: err?.message || 'Git commit failed' });
  }
});

// 21. Real Git Log (Commit history)
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
  } catch (err: any) {
    return res.json({ commits: [] });
  }
});

// 22. Real Git Branches (List local and remote)
router.post('/api/git/branches', async (req: Request, res: Response) => {
  const { cwd } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const { stdout } = await execAsync('git branch -a -v --no-abbrev', { cwd: targetCwd });
    const lines = stdout.split('\n').filter(Boolean);
    const branches = lines.map(line => {
      const isCurrent = line.startsWith('*');
      const cleanLine = line.replace(/^\*?\s+/, '');
      const parts = cleanLine.split(/\s+/);
      const name = parts[0];
      const commitHash = parts[1] || '';
      const commitMessage = parts.slice(2).join(' ') || '';
      const isRemote = name.startsWith('remotes/');

      return {
        name: isRemote ? name.replace(/^remotes\//, '') : name,
        isCurrent,
        isRemote,
        commitHash: commitHash.slice(0, 7),
        commitMessage,
      };
    });
    return res.json({ branches });
  } catch (err: any) {
    return res.json({ branches: [{ name: 'main', isCurrent: true, isRemote: false, commitHash: '', commitMessage: '' }] });
  }
});

// 23. Real Git Branch Create
router.post('/api/git/branch/create', async (req: Request, res: Response) => {
  const { cwd, name, checkout = false } = req.body;
  if (!name) return res.status(400).json({ error: 'Branch name is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const flag = checkout ? 'checkout -b' : 'branch';
    const { stdout } = await execAsync(`git ${flag} "${name}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Branch creation failed');
    return res.status(500).json({ error: err?.message || 'Branch creation failed' });
  }
});

// 24. Real Git Branch Checkout
router.post('/api/git/branch/checkout', async (req: Request, res: Response) => {
  const { cwd, name } = req.body;
  if (!name) return res.status(400).json({ error: 'Branch name is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const { stdout } = await execAsync(`git checkout "${name}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Branch checkout failed');
    return res.status(500).json({ error: err?.message || 'Branch checkout failed' });
  }
});

// 25. Real Git Branch Rename
router.post('/api/git/branch/rename', async (req: Request, res: Response) => {
  const { cwd, oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'oldName and newName are required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const { stdout } = await execAsync(`git branch -m "${oldName}" "${newName}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Branch rename failed');
    return res.status(500).json({ error: err?.message || 'Branch rename failed' });
  }
});

// 26. Real Git Branch Delete (with unmerged safeguards)
router.post('/api/git/branch/delete', async (req: Request, res: Response) => {
  const { cwd, name, force = false } = req.body;
  if (!name) return res.status(400).json({ error: 'Branch name is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const flag = force ? '-D' : '-d';
    const { stdout } = await execAsync(`git branch ${flag} "${name}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Branch deletion failed');
    return res.status(500).json({ error: err?.message || 'Branch deletion failed' });
  }
});

// 27. Real Git Remotes & Remote Operations
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
  } catch (err: any) {
    return res.json({ remotes: [] });
  }
});

router.post('/api/git/remote/add', async (req: Request, res: Response) => {
  const { cwd, name, url } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Remote name and URL are required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    await execAsync(`git remote add "${name}" "${url}"`, { cwd: targetCwd });
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Add remote failed');
    return res.status(500).json({ error: err?.message || 'Add remote failed' });
  }
});

router.post('/api/git/remote/remove', async (req: Request, res: Response) => {
  const { cwd, name } = req.body;
  if (!name) return res.status(400).json({ error: 'Remote name is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    await execAsync(`git remote remove "${name}"`, { cwd: targetCwd });
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Remove remote failed');
    return res.status(500).json({ error: err?.message || 'Remove remote failed' });
  }
});

// 28. Real Git Fetch, Pull, Push
router.post('/api/git/fetch', async (req: Request, res: Response) => {
  const { cwd, remote = 'origin' } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const { stdout, stderr } = await execAsync(`git fetch "${remote}"`, { cwd: targetCwd, timeout: 30000 });
    return res.json({ success: true, output: stdout || stderr });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git fetch failed');
    return res.status(500).json({ error: err?.message || 'Git fetch failed' });
  }
});

router.post('/api/git/pull', async (req: Request, res: Response) => {
  const { cwd, remote = 'origin', branch } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  const branchArg = branch ? ` "${branch}"` : '';

  try {
    const { stdout, stderr } = await execAsync(`git pull "${remote}"${branchArg}`, { cwd: targetCwd, timeout: 60000 });
    return res.json({ success: true, output: stdout || stderr });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git pull failed');
    return res.status(500).json({ error: err?.message || 'Git pull failed' });
  }
});

router.post('/api/git/push', async (req: Request, res: Response) => {
  const { cwd, remote = 'origin', branch, force = false } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  const branchArg = branch ? ` "${branch}"` : '';
  const forceFlag = force ? ' --force-with-lease' : '';

  try {
    const { stdout, stderr } = await execAsync(`git push${forceFlag} "${remote}"${branchArg}`, { cwd: targetCwd, timeout: 60000 });
    return res.json({ success: true, output: stdout || stderr });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git push failed');
    return res.status(500).json({ error: err?.message || 'Git push failed' });
  }
});

// 29. Real Git Tags
router.post('/api/git/tags', async (req: Request, res: Response) => {
  const { cwd } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const { stdout } = await execAsync('git tag -l -n1', { cwd: targetCwd });
    const lines = stdout.split('\n').filter(Boolean);
    const tags = lines.map(l => {
      const [name, ...msgParts] = l.trim().split(/\s+/);
      return { name, message: msgParts.join(' ') };
    });
    return res.json({ tags });
  } catch {
    return res.json({ tags: [] });
  }
});

router.post('/api/git/tag/create', async (req: Request, res: Response) => {
  const { cwd, name, message } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const msgArg = message ? ` -m "${message.replace(/"/g, '\\"')}"` : '';
    await execAsync(`git tag -a "${name}"${msgArg}`, { cwd: targetCwd });
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Tag creation failed');
    return res.status(500).json({ error: err?.message || 'Tag creation failed' });
  }
});

router.post('/api/git/tag/delete', async (req: Request, res: Response) => {
  const { cwd, name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    await execAsync(`git tag -d "${name}"`, { cwd: targetCwd });
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Tag deletion failed');
    return res.status(500).json({ error: err?.message || 'Tag deletion failed' });
  }
});

// 30. Real Git Stash Management
router.post('/api/git/stashes', async (req: Request, res: Response) => {
  const { cwd } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const { stdout } = await execAsync('git stash list --pretty=format:"%gd|%s|%aI"', { cwd: targetCwd });
    const lines = stdout.split('\n').filter(Boolean);
    const stashes = lines.map((l, idx) => {
      const [refName, message, timestamp] = l.split('|');
      return {
        index: idx,
        name: refName || `stash@{${idx}}`,
        message: message || 'WIP on branch',
        timestamp: timestamp || new Date().toISOString(),
      };
    });
    return res.json({ stashes });
  } catch {
    return res.json({ stashes: [] });
  }
});

router.post('/api/git/stash/save', async (req: Request, res: Response) => {
  const { cwd, message } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const safeMsg = (message || `Stash on ${new Date().toLocaleTimeString()}`).replace(/"/g, '\\"');
    const { stdout } = await execAsync(`git stash push -m "${safeMsg}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git stash failed');
    return res.status(500).json({ error: err?.message || 'Git stash failed' });
  }
});

router.post('/api/git/stash/apply', async (req: Request, res: Response) => {
  const { cwd, stashId = 'stash@{0}', pop = false } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  const action = pop ? 'pop' : 'apply';

  try {
    const { stdout } = await execAsync(`git stash ${action} "${stashId}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || `Git stash ${action} failed` });
  }
});

router.post('/api/git/stash/drop', async (req: Request, res: Response) => {
  const { cwd, stashId = 'stash@{0}' } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const { stdout } = await execAsync(`git stash drop "${stashId}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git stash drop failed');
    return res.status(500).json({ error: err?.message || 'Git stash drop failed' });
  }
});

// 31. Merge Conflict Detection and Resolution
router.post('/api/git/conflicts', async (req: Request, res: Response) => {
  const { cwd } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  try {
    const { stdout } = await execAsync('git diff --name-only --diff-filter=U', { cwd: targetCwd });
    const conflictFiles = stdout.split('\n').filter(Boolean);

    const detailedFiles = await Promise.all(
      conflictFiles.map(async f => {
        try {
          const content = await fsPromises.readFile(path.join(targetCwd, f), 'utf-8');
          const conflictRegex = /<<<<<<<[^\n]*\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>[^\n]*/g;
          const blocks = [];
          let m;
          let idx = 0;
          while ((m = conflictRegex.exec(content)) !== null) {
            blocks.push({
              id: `block-${idx++}`,
              currentContent: m[1],
              incomingContent: m[2],
            });
          }
          return { filePath: f, rawContent: content, conflicts: blocks };
        } catch {
          return { filePath: f, rawContent: '', conflicts: [] };
        }
      })
    );

    return res.json({ conflictFiles: detailedFiles });
  } catch {
    return res.json({ conflictFiles: [] });
  }
});

router.post('/api/git/conflict/resolve', async (req: Request, res: Response) => {
  const { cwd, filePath, resolvedContent } = req.body;
  if (!filePath || resolvedContent === undefined) {
    return res.status(400).json({ error: 'filePath and resolvedContent are required' });
  }

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const fullPath = path.join(targetCwd, filePath);
    await fsPromises.writeFile(fullPath, resolvedContent, 'utf-8');
    await execAsync(`git add "${filePath}"`, { cwd: targetCwd });
    return res.json({ success: true });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Conflict resolution failed');
    return res.status(500).json({ error: err?.message || 'Conflict resolution failed' });
  }
});

// 32. Cherry-Pick and Revert Workflows
router.post('/api/git/cherry-pick', async (req: Request, res: Response) => {
  const { cwd, hash } = req.body;
  if (!hash) return res.status(400).json({ error: 'Commit hash is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const { stdout } = await execAsync(`git cherry-pick "${hash}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Cherry-pick failed');
    return res.status(500).json({ error: err?.message || 'Cherry-pick failed' });
  }
});

router.post('/api/git/revert', async (req: Request, res: Response) => {
  const { cwd, hash } = req.body;
  if (!hash) return res.status(400).json({ error: 'Commit hash is required' });

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  try {
    const { stdout } = await execAsync(`git revert --no-edit "${hash}"`, { cwd: targetCwd });
    return res.json({ success: true, output: stdout });
  } catch (err: any) {
    serverLogger.error({ err, path: req.path }, 'Git revert failed');
    return res.status(500).json({ error: err?.message || 'Git revert failed' });
  }
});

// 33. Optional GitHub Integration
router.get('/api/github/auth-status', async (req: Request, res: Response) => {
  const token = sessionGitHubToken || process.env.GITHUB_TOKEN;
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

router.post('/api/github/set-token', async (req: Request, res: Response) => {
  const { token } = req.body;
  sessionGitHubToken = (token || '').trim();

  if (!sessionGitHubToken) {
    return res.json({ authenticated: false });
  }

  try {
    const user = await callGitHubApi('/user');
    return res.json({ authenticated: true, user: { login: user.login, name: user.name, avatarUrl: user.avatar_url } });
  } catch (err: any) {
    sessionGitHubToken = '';
    return res.status(401).json({ error: 'Invalid GitHub token. Ensure token has repo scope.' });
  }
});

router.post('/api/github/repo', async (req: Request, res: Response) => {
  const { owner, repo } = req.body;
  if (!owner || !repo) return res.status(400).json({ error: 'owner and repo are required' });

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
    return res.status(500).json({ error: err.message });
  }
});

router.post('/api/github/pulls', async (req: Request, res: Response) => {
  const { owner, repo, state = 'open' } = req.body;
  if (!owner || !repo) return res.status(400).json({ error: 'owner and repo are required' });

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
  } catch (err: any) {
    return res.json({ pulls: [] });
  }
});

router.post('/api/github/pull/create', async (req: Request, res: Response) => {
  const { owner, repo, title, body, head, base } = req.body;
  if (!owner || !repo || !title || !head || !base) {
    return res.status(400).json({ error: 'owner, repo, title, head, base are required' });
  }

  try {
    const pr = await callGitHubApi(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title, body, head, base }),
    });
    return res.json({ success: true, pullRequest: pr });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/api/github/issues', async (req: Request, res: Response) => {
  const { owner, repo, state = 'open' } = req.body;
  if (!owner || !repo) return res.status(400).json({ error: 'owner and repo are required' });

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
  } catch (err: any) {
    return res.json({ issues: [] });
  }
});

// 34. AI Git Assistant (Explain Diff, Suggest Commit Message, Review Regressions)
router.post('/api/ai/git-assistant', async (req: Request, res: Response) => {
  const { task, diff, branch, context } = req.body;

  if (!getAiClient()) {
    if (task === 'commit-message') {
      return res.json({ suggestedCommitMessage: 'feat: update workspace components and services' });
    }
    return res.json({ summary: 'Diff contains code changes across workspace.' });
  }

  try {
    if (task === 'commit-message') {
      const ai = getAiClient(); if (!ai) return res.status(400).json({ error: "AI Client not configured" }); const response: any = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert Git software engineer. Generate a concise Conventional Commit message (e.g. feat(editor): ..., fix(terminal): ...) based on the following diff:\n\n${(diff || '').slice(0, 4000)}`,
      });
      const suggestedCommitMessage = response.text?.trim().replace(/^`+|`+$/g, '') || 'chore: update workspace files';
      return res.json({ suggestedCommitMessage });
    }

    if (task === 'explain-diff') {
      const ai = getAiClient(); if (!ai) return res.status(400).json({ error: "AI Client not configured" }); const response: any = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Explain the following code diff clearly and concisely in 2-3 short bullet points, highlighting key behavioral changes:\n\n${(diff || '').slice(0, 6000)}`,
      });
      return res.json({ summary: response.text?.trim() || 'No explanation available.' });
    }

    if (task === 'review-changes') {
      const ai = getAiClient(); if (!ai) return res.status(400).json({ error: "AI Client not configured" }); const response: any = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Review the following code diff for potential bugs, security vulnerabilities, or regressions. Return concise findings:\n\n${(diff || '').slice(0, 6000)}`,
      });
      return res.json({ review: response.text?.trim() || 'No issues detected.' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.json({
      suggestedCommitMessage: 'feat: update project codebase and verify tests',
      summary: 'Diff review generated by fallback analyzer.',
    });
  }
});

// 35. Real Git Clone
router.post('/api/git/clone', async (req: Request, res: Response) => {
  const { repoUrl, targetDir } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

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
    return res.status(500).json({ error: err?.message || 'Git clone failed' });
  }
});

// ==========================================
// REAL PROJECT DETECTION ENDPOINT
// ==========================================


  return router;
}
