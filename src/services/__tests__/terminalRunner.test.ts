import { describe, it, expect, beforeEach } from 'vitest';
import { TerminalRunner } from '../terminalRunner';
import { VirtualFileSystem } from '../virtualFs';
import { FileNode } from '../../types/ide';

describe('TerminalRunner Service', () => {
  let vfs: VirtualFileSystem;
  let runner: TerminalRunner;

  const initialTree: FileNode[] = [
    {
      id: 'f-readme',
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      content: '# Test Project\nWelcome to testing.',
    },
    {
      id: 'f-pkg',
      name: 'package.json',
      path: 'package.json',
      type: 'file',
      content: JSON.stringify({
        name: 'test-app',
        scripts: { test: 'vitest run', lint: 'eslint src/', build: 'vite build' },
      }),
    },
    {
      id: 'dir-src',
      name: 'src',
      path: 'src',
      type: 'folder',
      children: [
        {
          id: 'f-app',
          name: 'App.tsx',
          path: 'src/App.tsx',
          type: 'file',
          content: 'export default function App() { return <div>App</div>; }',
        },
        {
          id: 'f-test',
          name: 'App.test.tsx',
          path: 'src/App.test.tsx',
          type: 'file',
          content: 'it("renders App component", () => {});',
        },
      ],
    },
  ];

  beforeEach(() => {
    vfs = new VirtualFileSystem(initialTree);
    runner = new TerminalRunner(vfs);
  });

  it('returns empty result for blank or whitespace commands', () => {
    const res = runner.execute('   ');
    expect(res.lines.length).toBe(0);
    expect(res.exitCode).toBe(0);
  });

  it('handles help command displaying supported commands', () => {
    const res = runner.execute('help');
    expect(res.exitCode).toBe(0);
    expect(res.lines.some(l => l.text.includes('Vertex Forge Sandboxed Execution Terminal'))).toBe(true);
    expect(res.lines.some(l => l.text.includes('npm test'))).toBe(true);
  });

  it('handles clear command returning empty lines', () => {
    const res = runner.execute('clear');
    expect(res.lines.length).toBe(0);
    expect(res.exitCode).toBe(0);
  });

  it('lists directory contents with ls', () => {
    const res = runner.execute('ls');
    expect(res.exitCode).toBe(0);
    expect(res.lines.some(l => l.text.includes('README.md'))).toBe(true);
    expect(res.lines.some(l => l.text.includes('package.json'))).toBe(true);
  });

  it('reads file contents with cat', () => {
    const res = runner.execute('cat README.md');
    expect(res.exitCode).toBe(0);
    expect(res.lines.some(l => l.text.includes('# Test Project'))).toBe(true);
  });

  it('returns error when cat is executed on non-existent file', () => {
    const res = runner.execute('cat nonexistent.txt');
    expect(res.exitCode).toBe(1);
    expect(res.lines.some(l => l.text.includes('No such file or directory'))).toBe(true);
  });

  it('runs automated test simulation via runTests', () => {
    const res = runner.runTests();
    expect(res.testResults).toBeDefined();
    expect(res.testResults!.length).toBeGreaterThan(0);
    expect(res.exitCode).toBe(0);
  });

  it('runs static code analysis diagnostics via runLint', () => {
    const res = runner.runLint();
    expect(res.lines).toBeDefined();
    expect(res.diagnostics).toBeDefined();
    expect(res.exitCode).toBe(0);
  });

  it('runs project build simulation via runBuild', () => {
    const res = runner.runBuild();
    expect(res.exitCode).toBe(0);
    expect(res.lines.some(l => l.text.includes('building for production'))).toBe(true);
  });

  it('executes git status, log, and commit operations', () => {
    const statusRes = runner.execute('git status');
    expect(statusRes.lines.some(l => l.text.includes('On branch'))).toBe(true);

    const logRes = runner.execute('git log');
    expect(logRes.lines.length).toBeGreaterThan(0);

    const commitRes = runner.execute('git commit -m "feat: initial commit"');
    expect(commitRes.lines.some(l => l.text.includes('files changed'))).toBe(true);
  });

  it('updates VFS reference dynamically', () => {
    const newVfs = new VirtualFileSystem([
      { id: 'f-new', name: 'newFile.txt', path: 'newFile.txt', type: 'file', content: 'hello' }
    ]);
    runner.updateVFS(newVfs);
    const lsRes = runner.execute('ls');
    expect(lsRes.lines.some(l => l.text.includes('newFile.txt'))).toBe(true);
  });
});
