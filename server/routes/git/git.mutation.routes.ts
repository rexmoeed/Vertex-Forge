import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fsPromises from 'fs/promises';
import { serverLogger } from '../../logger';
import { AppError, ValidationError } from '../../errors';
import { execAsync } from './git.utils';

export function createGitMutationRouter(): Router {
  const router = Router();

  // Stage
  router.post('/api/git/stage', async (req: Request, res: Response, next: NextFunction) => {
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
      return next(new AppError(err?.message || 'Git add failed', 500, 'GIT_STAGE_ERROR'));
    }
  });

  // Unstage
  router.post('/api/git/unstage', async (req: Request, res: Response, next: NextFunction) => {
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
      return next(new AppError(err?.message || 'Git unstage failed', 500, 'GIT_UNSTAGE_ERROR'));
    }
  });

  // Discard
  router.post('/api/git/discard', async (req: Request, res: Response, next: NextFunction) => {
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
      return next(new AppError(err?.message || 'Git discard failed', 500, 'GIT_DISCARD_ERROR'));
    }
  });

  // Clean untracked
  router.post('/api/git/clean-untracked', async (req: Request, res: Response, next: NextFunction) => {
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
      return next(new AppError(err?.message || 'Git clean failed', 500, 'GIT_CLEAN_ERROR'));
    }
  });

  // Commit
  router.post('/api/git/commit', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, message, amend = false } = req.body;
    if (!message && !amend) {
      return next(new ValidationError('Commit message is required', { field: 'message' }));
    }

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const safeMsg = (message || '').replace(/"/g, '\\"');
      const amendFlag = amend ? ' --amend' : '';
      const msgFlag = safeMsg ? ` -m "${safeMsg}"` : ' --no-edit';
      const { stdout } = await execAsync(`git commit${amendFlag}${msgFlag}`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git commit failed');
      return next(new AppError(err?.message || 'Git commit failed', 500, 'GIT_COMMIT_ERROR'));
    }
  });

  // Stashes list
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

  // Stash save
  router.post('/api/git/stash/save', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, message } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      const safeMsg = (message || `Stash on ${new Date().toLocaleTimeString()}`).replace(/"/g, '\\"');
      const { stdout } = await execAsync(`git stash push -m "${safeMsg}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git stash failed');
      return next(new AppError(err?.message || 'Git stash failed', 500, 'GIT_STASH_SAVE_ERROR'));
    }
  });

  // Stash apply
  router.post('/api/git/stash/apply', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, stashId = 'stash@{0}', pop = false } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    const action = pop ? 'pop' : 'apply';

    try {
      const { stdout } = await execAsync(`git stash ${action} "${stashId}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      return next(new AppError(err?.message || `Git stash ${action} failed`, 500, 'GIT_STASH_APPLY_ERROR'));
    }
  });

  // Stash drop
  router.post('/api/git/stash/drop', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, stashId = 'stash@{0}' } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      const { stdout } = await execAsync(`git stash drop "${stashId}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git stash drop failed');
      return next(new AppError(err?.message || 'Git stash drop failed', 500, 'GIT_STASH_DROP_ERROR'));
    }
  });

  // Conflicts list
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

  // Conflict resolve
  router.post('/api/git/conflict/resolve', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, filePath, resolvedContent } = req.body;
    if (!filePath || resolvedContent === undefined) {
      return next(new ValidationError('filePath and resolvedContent are required'));
    }

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const fullPath = path.join(targetCwd, filePath);
      await fsPromises.writeFile(fullPath, resolvedContent, 'utf-8');
      await execAsync(`git add "${filePath}"`, { cwd: targetCwd });
      return res.json({ success: true });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Conflict resolution failed');
      return next(new AppError(err?.message || 'Conflict resolution failed', 500, 'GIT_CONFLICT_RESOLVE_ERROR'));
    }
  });

  // Cherry-pick
  router.post('/api/git/cherry-pick', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, hash } = req.body;
    if (!hash) return next(new ValidationError('Commit hash is required', { field: 'hash' }));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const { stdout } = await execAsync(`git cherry-pick "${hash}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Cherry-pick failed');
      return next(new AppError(err?.message || 'Cherry-pick failed', 500, 'GIT_CHERRY_PICK_ERROR'));
    }
  });

  // Revert
  router.post('/api/git/revert', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, hash } = req.body;
    if (!hash) return next(new ValidationError('Commit hash is required', { field: 'hash' }));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const { stdout } = await execAsync(`git revert --no-edit "${hash}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Git revert failed');
      return next(new AppError(err?.message || 'Git revert failed', 500, 'GIT_REVERT_ERROR'));
    }
  });

  return router;
}
