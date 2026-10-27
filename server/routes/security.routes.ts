import { Router, Request, Response } from 'express';
import path from 'path';
import { serverLogger } from '../logger';
import { SecurityAuditEngine } from '../../src/services/securityAuditEngine';

export function createSecurityRouter(): Router {
  const router = Router();

  // 1. Run workspace security & dependency audit
  router.post('/api/security/audit', async (req: Request, res: Response) => {
    const { projectPath } = req.body;
    const targetDir = projectPath ? path.resolve(projectPath) : process.cwd();

    try {
      const report = await SecurityAuditEngine.auditWorkspace(targetDir);
      return res.json(report);
    } catch (err: unknown) {
      serverLogger.error({ err }, '[API /api/security/audit] Error');
      return res.status(500).json({
        error: 'Security audit failed',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 2. Apply safe remediation for a security finding
  router.post('/api/security/remediate', async (req: Request, res: Response) => {
    const { finding, workspaceDir } = req.body;
    const targetDir = workspaceDir ? path.resolve(workspaceDir) : process.cwd();

    if (!finding) {
      return res.status(400).json({ error: 'Finding payload required' });
    }

    try {
      const result = await SecurityAuditEngine.applyRemediation(finding, targetDir);
      return res.json(result);
    } catch (err: unknown) {
      serverLogger.error({ err }, '[API /api/security/remediate] Error');
      return res.status(500).json({
        error: 'Remediation failed',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 3. Verify resolution of a specific finding
  router.post('/api/security/verify', async (req: Request, res: Response) => {
    const { finding, workspaceDir } = req.body;
    const targetDir = workspaceDir ? path.resolve(workspaceDir) : process.cwd();

    if (!finding) {
      return res.status(400).json({ error: 'Finding payload required' });
    }

    try {
      const result = await SecurityAuditEngine.verifyFindingResolution(finding, targetDir);
      return res.json(result);
    } catch (err: unknown) {
      serverLogger.error({ err }, '[API /api/security/verify] Error');
      return res.status(500).json({
        error: 'Verification failed',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 4. Create or reset deliberately vulnerable test fixture
  router.post('/api/security/fixture/create', async (_req: Request, res: Response) => {
    try {
      const fixturePath = await SecurityAuditEngine.createVulnerableFixture();
      return res.json({ success: true, fixturePath });
    } catch (err: unknown) {
      serverLogger.error({ err }, '[API /api/security/fixture/create] Error');
      return res.status(500).json({
        error: 'Failed to create vulnerable fixture',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return router;
}
