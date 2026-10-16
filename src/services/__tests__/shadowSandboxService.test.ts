import { describe, it, expect, beforeEach } from 'vitest';
import { ShadowSandboxService } from '../shadowSandboxService';
import { VirtualFileSystem } from '../virtualFs';

describe('ShadowSandboxService', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    // Reset service state
    ShadowSandboxService.clearAllSessions();

    // Create a mock VFS with some files
    vfs = new VirtualFileSystem([
      {
        id: '1',
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            id: '2',
            name: 'index.ts',
            type: 'file',
            path: 'src/index.ts',
            content: 'import { helper } from "./helper";\nconsole.log(helper());'
          },
          {
            id: '3',
            name: 'helper.ts',
            type: 'file',
            path: 'src/helper.ts',
            content: 'export const helper = () => "Hello";'
          }
        ]
      }
    ]);
  });

  // 1. Creates a valid sandbox session from VFS state.
  it('Creates a valid sandbox session from VFS state', () => {
    const session = ShadowSandboxService.createSession(vfs, 'test-session-1');
    expect(session.sessionId).toBe('test-session-1');
    expect(session.shadowFiles.get('src/index.ts')).toBeDefined();
    expect(session.shadowFiles.get('src/helper.ts')).toBeDefined();
  });

  // 2. Stages "create" and "modify" mutations.
  it('Stages "create" and "modify" mutations', () => {
    ShadowSandboxService.createSession(vfs, 'test-session-2');
    const result = ShadowSandboxService.stageMutations('test-session-2', [
      { path: 'src/new-file.ts', type: 'create', content: 'console.log("new");' },
      { path: 'src/index.ts', type: 'modify', content: 'console.log("modified");' }
    ]);
    expect(result.success).toBe(true);
    expect(result.stagedCount).toBe(2);
    const session = ShadowSandboxService.getSession('test-session-2')!;
    expect(session.shadowFiles.get('src/new-file.ts')).toBe('console.log("new");');
    expect(session.shadowFiles.get('src/index.ts')).toBe('console.log("modified");');
  });

  // 3. Stages "delete" mutations.
  it('Stages "delete" mutations', () => {
    ShadowSandboxService.createSession(vfs, 'test-session-3');
    ShadowSandboxService.stageMutations('test-session-3', [
      { path: 'src/helper.ts', type: 'delete' }
    ]);
    const session = ShadowSandboxService.getSession('test-session-3')!;
    expect(session.shadowFiles.has('src/helper.ts')).toBe(false);
  });

  // 4. Successfully auto-verifies perfect syntax and imports.
  it('Successfully auto-verifies perfect syntax and imports', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-4');
    ShadowSandboxService.stageMutations('test-session-4', [
      { path: 'src/new.ts', type: 'create', content: 'import { helper } from "./helper";\nfunction test() { return helper(); }' }
    ]);
    const report = await ShadowSandboxService.runAutoVerification('test-session-4');
    expect(report.passed).toBe(true);
    expect(report.diagnostics.length).toBe(0);
  });

  // 5. Fails auto-verification due to unbalanced curly braces (syntax error).
  it('Fails auto-verification due to unbalanced curly braces (syntax error)', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-5');
    ShadowSandboxService.stageMutations('test-session-5', [
      { path: 'src/broken.ts', type: 'create', content: 'function test() { console.log("hello"); ' }
    ]);
    const report = await ShadowSandboxService.runAutoVerification('test-session-5');
    expect(report.passed).toBe(false);
    expect(report.diagnostics[0].type).toBe('syntax_error');
    expect(report.diagnostics[0].message).toContain('Unbalanced curly braces');
  });

  // 6. Fails auto-verification due to unbalanced parentheses (syntax error).
  it('Fails auto-verification due to unbalanced parentheses (syntax error)', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-6');
    ShadowSandboxService.stageMutations('test-session-6', [
      { path: 'src/broken.ts', type: 'create', content: 'function test() { console.log("hello"; }' }
    ]);
    const report = await ShadowSandboxService.runAutoVerification('test-session-6');
    expect(report.passed).toBe(false);
    expect(report.diagnostics[0].type).toBe('syntax_error');
    expect(report.diagnostics[0].message).toContain('Unbalanced parentheses');
  });

  // 7. Fails auto-verification due to broken relative imports.
  it('Fails auto-verification due to broken relative imports', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-7');
    ShadowSandboxService.stageMutations('test-session-7', [
      { path: 'src/broken-import.ts', type: 'create', content: 'import { missing } from "./missing-file";' }
    ]);
    const report = await ShadowSandboxService.runAutoVerification('test-session-7');
    expect(report.passed).toBe(false);
    expect(report.diagnostics[0].type).toBe('broken_import');
    expect(report.diagnostics[0].message).toContain('Cannot resolve relative import target');
  });

  // 8. Security gate blocks modification to `.env` files.
  it('Security gate blocks modification to `.env` files', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-8');
    ShadowSandboxService.stageMutations('test-session-8', [
      { path: '.env', type: 'create', content: 'SECRET=123' }
    ]);
    const report = await ShadowSandboxService.runAutoVerification('test-session-8');
    expect(report.passed).toBe(false);
    expect(report.diagnostics[0].type).toBe('security_gate');
  });

  // 9. Security gate blocks modification to files containing `credentials`.
  it('Security gate blocks modification to files containing `credentials`', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-9');
    ShadowSandboxService.stageMutations('test-session-9', [
      { path: 'src/config/credentials.json', type: 'create', content: '{}' }
    ]);
    const report = await ShadowSandboxService.runAutoVerification('test-session-9');
    expect(report.passed).toBe(false);
    expect(report.diagnostics[0].type).toBe('security_gate');
  });

  // 10. Successfully commits verified changes atomically to VFS.
  it('Successfully commits verified changes atomically to VFS', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-10');
    ShadowSandboxService.stageMutations('test-session-10', [
      { path: 'src/index.ts', type: 'modify', content: 'console.log("updated");' },
      { path: 'src/new.ts', type: 'create', content: 'console.log("new");' }
    ]);
    await ShadowSandboxService.runAutoVerification('test-session-10');
    const result = ShadowSandboxService.commitStagedChanges('test-session-10', vfs);
    expect(result.success).toBe(true);
    expect(vfs.readFile('src/index.ts')).toBe('console.log("updated");');
    expect(vfs.readFile('src/new.ts')).toBe('console.log("new");');
  });

  // 11. Rejects committing unverified changes.
  it('Rejects committing unverified changes', () => {
    ShadowSandboxService.createSession(vfs, 'test-session-11');
    ShadowSandboxService.stageMutations('test-session-11', [
      { path: 'src/index.ts', type: 'modify', content: 'console.log("updated");' }
    ]);
    // Did not run verification
    const result = ShadowSandboxService.commitStagedChanges('test-session-11', vfs);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot commit unverified changes');
  });

  // 12. Successfully rolls back an atomic commit.
  it('Successfully rolls back an atomic commit', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-12');
    ShadowSandboxService.stageMutations('test-session-12', [
      { path: 'src/index.ts', type: 'modify', content: 'console.log("updated");' }
    ]);
    await ShadowSandboxService.runAutoVerification('test-session-12');
    const result = ShadowSandboxService.commitStagedChanges('test-session-12', vfs);
    expect(result.success).toBe(true);
    expect(vfs.readFile('src/index.ts')).toBe('console.log("updated");');

    const rolledBack = ShadowSandboxService.rollbackCommit(result.commitId, vfs);
    expect(rolledBack).toBe(true);
    expect(vfs.readFile('src/index.ts')).toBe('import { helper } from "./helper";\nconsole.log(helper());');
  });

  // 13. Throws error when staging mutations on a non-existent session.
  it('Throws error when staging mutations on a non-existent session', () => {
    expect(() => {
      ShadowSandboxService.stageMutations('non-existent', []);
    }).toThrowError(/not found/);
  });

  // 14. Throws error when running verification on a non-existent session.
  it('Throws error when running verification on a non-existent session', async () => {
    await expect(ShadowSandboxService.runAutoVerification('non-existent')).rejects.toThrowError(/not found/);
  });

  // 15. Can retrieve commit history.
  it('Can retrieve commit history', async () => {
    ShadowSandboxService.createSession(vfs, 'test-session-15');
    ShadowSandboxService.stageMutations('test-session-15', [
      { path: 'src/test.ts', type: 'create', content: 'console.log("test");' }
    ]);
    await ShadowSandboxService.runAutoVerification('test-session-15');
    const commitResult = ShadowSandboxService.commitStagedChanges('test-session-15', vfs);

    const history = ShadowSandboxService.getCommitHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].commitId).toBe(commitResult.commitId);
  });
});