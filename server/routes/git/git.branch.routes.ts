import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { serverLogger } from '../../logger';
import { AppError, ValidationError } from '../../errors';
import { execAsync } from './git.utils';

export function createGitBranchRouter(): Router {
  const router = Router();

  // List branches
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
    } catch {
      return res.json({ branches: [{ name: 'main', isCurrent: true, isRemote: false, commitHash: '', commitMessage: '' }] });
    }
  });

  // Create branch
  router.post('/api/git/branch/create', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, name, checkout = false } = req.body;
    if (!name) return next(new ValidationError('Branch name is required', { field: 'name' }));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const flag = checkout ? 'checkout -b' : 'branch';
      const { stdout } = await execAsync(`git ${flag} "${name}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Branch creation failed');
      return next(new AppError(err?.message || 'Branch creation failed', 500, 'GIT_BRANCH_CREATE_ERROR'));
    }
  });

  // Checkout branch
  router.post('/api/git/branch/checkout', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, name } = req.body;
    if (!name) return next(new ValidationError('Branch name is required', { field: 'name' }));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const { stdout } = await execAsync(`git checkout "${name}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Branch checkout failed');
      return next(new AppError(err?.message || 'Branch checkout failed', 500, 'GIT_BRANCH_CHECKOUT_ERROR'));
    }
  });

  // Rename branch
  router.post('/api/git/branch/rename', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, oldName, newName } = req.body;
    if (!oldName || !newName) return next(new ValidationError('oldName and newName are required'));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const { stdout } = await execAsync(`git branch -m "${oldName}" "${newName}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Branch rename failed');
      return next(new AppError(err?.message || 'Branch rename failed', 500, 'GIT_BRANCH_RENAME_ERROR'));
    }
  });

  // Delete branch
  router.post('/api/git/branch/delete', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, name, force = false } = req.body;
    if (!name) return next(new ValidationError('Branch name is required', { field: 'name' }));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const flag = force ? '-D' : '-d';
      const { stdout } = await execAsync(`git branch ${flag} "${name}"`, { cwd: targetCwd });
      return res.json({ success: true, output: stdout });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Branch deletion failed');
      return next(new AppError(err?.message || 'Branch deletion failed', 500, 'GIT_BRANCH_DELETE_ERROR'));
    }
  });

  // Tags list
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

  // Create tag
  router.post('/api/git/tag/create', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, name, message } = req.body;
    if (!name) return next(new ValidationError('Tag name is required', { field: 'name' }));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      const msgArg = message ? ` -m "${message.replace(/"/g, '\\"')}"` : '';
      await execAsync(`git tag -a "${name}"${msgArg}`, { cwd: targetCwd });
      return res.json({ success: true });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Tag creation failed');
      return next(new AppError(err?.message || 'Tag creation failed', 500, 'GIT_TAG_CREATE_ERROR'));
    }
  });

  // Delete tag
  router.post('/api/git/tag/delete', async (req: Request, res: Response, next: NextFunction) => {
    const { cwd, name } = req.body;
    if (!name) return next(new ValidationError('Tag name is required', { field: 'name' }));

    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    try {
      await execAsync(`git tag -d "${name}"`, { cwd: targetCwd });
      return res.json({ success: true });
    } catch (err: any) {
      serverLogger.error({ err, path: req.path }, 'Tag deletion failed');
      return next(new AppError(err?.message || 'Tag deletion failed', 500, 'GIT_TAG_DELETE_ERROR'));
    }
  });

  return router;
}
