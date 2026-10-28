import { describe, it, expect, vi } from 'vitest';
import { createVulnerableFixture } from '../fixtureGenerator';
import fsPromises from 'fs/promises';

describe('Security: Vulnerable Fixture Generator', () => {
  it('creates synthetic vulnerable projects for security auditor regression tests', async () => {
    const mkdirSpy = vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
    const writeFileSpy = vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);

    const fixturePath = await createVulnerableFixture('/tmp/test-workspace');

    expect(fixturePath).toContain('security-fixtures');
    expect(mkdirSpy).toHaveBeenCalled();
    // Verifies that package.json, server.js, client.tsx, and dockerfile/k8s fixtures are written
    expect(writeFileSpy).toHaveBeenCalled();
    expect(writeFileSpy.mock.calls.length).toBeGreaterThanOrEqual(3);

    mkdirSpy.mockRestore();
    writeFileSpy.mockRestore();
  });
});
