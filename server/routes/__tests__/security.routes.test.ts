import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { SecurityAuditEngine } from '../../../src/services/securityAuditEngine';

describe('Server Security Routes (/api/security)', () => {
  const { app } = createApp();

  describe('POST /api/security/audit', () => {
    it('runs workspace security audit and returns report', async () => {
      vi.spyOn(SecurityAuditEngine, 'auditWorkspace').mockResolvedValueOnce({
        summary: {
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          totalIssues: 0,
          overallScore: 100,
        },
        findings: [],
        timestamp: Date.now(),
      } as any);

      const res = await request(app)
        .post('/api/security/audit')
        .send({ projectPath: process.cwd() });

      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(Array.isArray(res.body.findings)).toBe(true);
      expect(res.body.summary.overallScore).toBe(100);
    });
  });

  describe('POST /api/security/remediate', () => {
    it('returns 400 when finding payload is missing', async () => {
      const res = await request(app)
        .post('/api/security/remediate')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Finding payload required');
    });
  });

  describe('POST /api/security/verify', () => {
    it('returns 400 when finding payload is missing', async () => {
      const res = await request(app)
        .post('/api/security/verify')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Finding payload required');
    });
  });
});
