import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createGitRouter } from '../git.routes';
import { errorHandler } from '../../middleware/errorHandler';

// Mock child_process exec cleanly with importOriginal
vi.mock('child_process', async (importOriginal) => {
  const actual: any = await importOriginal();
  const mockExec = vi.fn((cmd: string, opts: any, callback: any) => {
    if (typeof opts === 'function') {
      callback = opts;
    }

    if (cmd.startsWith('git status')) {
      return callback(null, {
        stdout: '## main...origin/main [ahead 1, behind 2]\n M src/App.tsx\nM  package.json\n?? newfile.ts\n',
        stderr: '',
      });
    }

    if (cmd.startsWith('git branch -a')) {
      return callback(null, {
        stdout: '* main 1234567 Initial commit\n  feat/ui 7654321 Update UI\n  remotes/origin/main 1234567 Initial commit\n',
        stderr: '',
      });
    }

    if (cmd.startsWith('git log')) {
      return callback(null, {
        stdout: 'a1b2c3d|a1b2c3d|feat: add new feature|Test Author|test@example.com|2026-10-27T10:00:00Z|1 hour ago|(HEAD -> main)\n',
        stderr: '',
      });
    }

    if (cmd.startsWith('git diff')) {
      return callback(null, {
        stdout: 'diff --git a/file.ts b/file.ts\n+console.log("hello");\n',
        stderr: '',
      });
    }

    if (cmd.startsWith('git remote -v')) {
      return callback(null, {
        stdout: 'origin https://github.com/rexmoeed/Vertex-Forge.git (fetch)\norigin https://github.com/rexmoeed/Vertex-Forge.git (push)\n',
        stderr: '',
      });
    }

    if (cmd.startsWith('git commit')) {
      return callback(null, { stdout: '[main 9999999] feat: committed changes\n 1 file changed\n', stderr: '' });
    }

    if (cmd.startsWith('git add') || cmd.startsWith('git tag') || cmd.startsWith('git checkout') || cmd.startsWith('git init')) {
      return callback(null, { stdout: 'Success', stderr: '' });
    }

    return callback(null, { stdout: '', stderr: '' });
  });

  return {
    ...actual,
    default: {
      ...actual,
      exec: mockExec,
    },
    exec: mockExec,
  };
});

describe('Modular Git Routes & AppError Handling', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(createGitRouter(() => null));
    app.use(errorHandler);
  });

  describe('Git Status & Discovery Routes', () => {
    it('returns parsed status for valid repo', async () => {
      const res = await request(app).post('/api/git/status').send({ cwd: '/test' });
      expect(res.status).toBe(200);
      expect(res.body.isRepo).toBe(true);
      expect(res.body.branch).toBe('main');
      expect(res.body.ahead).toBe(1);
      expect(res.body.behind).toBe(2);
      expect(res.body.staged.length).toBeGreaterThan(0);
      expect(res.body.unstaged.length).toBeGreaterThan(0);
      expect(res.body.untracked.length).toBeGreaterThan(0);
    });

    it('returns diff output', async () => {
      const res = await request(app).post('/api/git/diff').send({ cwd: '/test' });
      expect(res.status).toBe(200);
      expect(res.body.diff).toContain('console.log');
    });

    it('returns commits list from git log', async () => {
      const res = await request(app).post('/api/git/log').send({ cwd: '/test' });
      expect(res.status).toBe(200);
      expect(res.body.commits).toHaveLength(1);
      expect(res.body.commits[0].shortHash).toBe('a1b2c3d');
    });
  });

  describe('Git Branch & Remote Routes', () => {
    it('lists branches correctly', async () => {
      const res = await request(app).post('/api/git/branches').send({ cwd: '/test' });
      expect(res.status).toBe(200);
      expect(res.body.branches.length).toBeGreaterThan(0);
      const current = res.body.branches.find((b: any) => b.isCurrent);
      expect(current).toBeDefined();
      expect(current.name).toBe('main');
    });

    it('returns 400 ValidationError when branch create is missing name', async () => {
      const res = await request(app).post('/api/git/branch/create').send({ cwd: '/test' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Branch name is required');
    });

    it('creates branch when valid name is provided', async () => {
      const res = await request(app).post('/api/git/branch/create').send({ cwd: '/test', name: 'feat/test' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns remotes list correctly', async () => {
      const res = await request(app).post('/api/git/remotes').send({ cwd: '/test' });
      expect(res.status).toBe(200);
      expect(res.body.remotes).toHaveLength(1);
      expect(res.body.remotes[0].name).toBe('origin');
    });
  });

  describe('Git Mutation Routes', () => {
    it('stages changes', async () => {
      const res = await request(app).post('/api/git/stage').send({ cwd: '/test', filePath: '.' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 ValidationError when commit message is missing', async () => {
      const res = await request(app).post('/api/git/commit').send({ cwd: '/test' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('commits changes when message is provided', async () => {
      const res = await request(app).post('/api/git/commit').send({ cwd: '/test', message: 'feat: test commit' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GitHub Authentication State', () => {
    it('returns authenticated: false when no token is present', async () => {
      const res = await request(app).get('/api/github/auth-status');
      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });
  });
});
