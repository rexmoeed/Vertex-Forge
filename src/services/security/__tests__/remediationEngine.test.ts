import { describe, it, expect, vi } from 'vitest';
import { applyRemediation } from '../remediationEngine';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { SecurityFinding } from '../../../types/securityAudit';

describe('Security: Remediation Engine', () => {
  it('returns failure when required finding parameters are missing for dependency upgrade', async () => {
    const invalidFinding: SecurityFinding = {
      id: 'test-1',
      ruleId: 'SEC-DEP-001',
      category: 'dependency',
      severity: 'high',
      title: 'Vulnerable pkg',
      filePath: 'package.json',
      lineStart: 1,
      lineEnd: 1,
      evidence: 'old-pkg',
      explanation: 'Old vulnerable version',
      attackVector: 'Supply chain',
      recommendedFix: 'Upgrade',
      confidence: 'high',
      confidenceReason: 'Manifest match',
      limitations: 'None',
      remediation: {
        type: 'dependency_upgrade',
        title: 'Upgrade',
        description: 'Upgrade pkg',
        targetFile: 'package.json',
        lineStart: 1,
        lineEnd: 1,
        requiresApproval: false,
      },
    };

    const result = await applyRemediation(invalidFinding, process.cwd());
    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing package name');
  });

  it('safely extracts hardcoded secrets into process.env references', async () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readFileSpy = vi.spyOn(fsPromises, 'readFile').mockResolvedValue(
      'const client = new OpenAI({ apiKey: "sk-proj-1234567890abcdef1234567890" });\n'
    );
    const writeFileSpy = vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
    const appendFileSpy = vi.spyOn(fsPromises, 'appendFile').mockResolvedValue(undefined);

    const secretFinding: SecurityFinding = {
      id: 'test-secret-1',
      ruleId: 'SEC-SECRETS-001',
      category: 'secret',
      severity: 'critical',
      title: 'Committed Secret',
      filePath: 'src/api.ts',
      lineStart: 1,
      lineEnd: 1,
      evidence: 'sk-proj-...',
      explanation: 'Secret found',
      attackVector: 'Credential compromise',
      recommendedFix: 'Extract to env',
      confidence: 'high',
      confidenceReason: 'Known pattern',
      limitations: 'None',
      remediation: {
        type: 'redact_secret',
        title: 'Extract to env',
        description: 'Extract to env',
        targetFile: 'src/api.ts',
        lineStart: 1,
        lineEnd: 1,
        requiresApproval: false,
      },
    };

    const result = await applyRemediation(secretFinding, process.cwd());
    expect(result.success).toBe(true);
    expect(result.modifiedFiles).toContain('src/api.ts');
    expect(writeFileSpy).toHaveBeenCalled();
    const writtenContent = writeFileSpy.mock.calls[0][1] as string;
    expect(writtenContent).toContain('process.env.OPENAI_API_KEY');

    existsSpy.mockRestore();
    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
    appendFileSpy.mockRestore();
  });
});
