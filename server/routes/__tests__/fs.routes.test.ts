import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import path from 'path';

describe('Server File System Routes (/api/fs)', () => {
  const { app } = createApp();

  describe('GET /api/fs/drives', () => {
    it('returns an array of available system drives', async () => {
      const res = await request(app).get('/api/fs/drives');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/fs/browse-dirs', () => {
    it('returns an array of available system drives and breadcrumbs', async () => {
      const res = await request(app)
        .post('/api/fs/browse-dirs')
        .send({ targetDir: process.cwd() });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.drives)).toBe(true);
      expect(res.body.drives.length).toBeGreaterThan(0);
      expect(res.body.currentPath).toBeDefined();
    });
  });

  describe('POST /api/fs/read-dir', () => {
    it('reads directory tree for valid directory path', async () => {
      const res = await request(app)
        .post('/api/fs/read-dir')
        .send({ dirPath: process.cwd(), maxDepth: 1 });

      expect(res.status).toBe(200);
      expect(res.body.rootPath).toBeDefined();
      expect(res.body.tree).toBeDefined();
    });

    it('returns 404 for non-existent directory', async () => {
      const nonExistentPath = path.resolve(process.cwd(), 'non-existent-subfolder-xyz');
      const res = await request(app)
        .post('/api/fs/read-dir')
        .send({ dirPath: nonExistentPath });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Directory not found');
    });
  });

  describe('POST /api/fs/read-file', () => {
    it('returns 400 when filePath is missing', async () => {
      const res = await request(app)
        .post('/api/fs/read-file')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('filePath is required');
    });

    it('reads valid file content like package.json', async () => {
      const res = await request(app)
        .post('/api/fs/read-file')
        .send({ filePath: 'package.json', cwd: process.cwd() });

      expect(res.status).toBe(200);
      expect(res.body.content).toContain('vertex-forge');
    });

    it('returns 404 when target file does not exist', async () => {
      const res = await request(app)
        .post('/api/fs/read-file')
        .send({ filePath: 'does-not-exist.json', cwd: process.cwd() });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('File not found');
    });
  });

  describe('POST /api/fs/validate-file', () => {
    it('blocks path traversal attempts', async () => {
      const res = await request(app)
        .post('/api/fs/validate-file')
        .send({ filePath: '../../../etc/passwd', cwd: process.cwd() });

      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('Path traversal is forbidden');
    });

    it('successfully validates existing project file', async () => {
      const res = await request(app)
        .post('/api/fs/validate-file')
        .send({ filePath: 'package.json', cwd: process.cwd() });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.isFile).toBe(true);
    });
  });
});
