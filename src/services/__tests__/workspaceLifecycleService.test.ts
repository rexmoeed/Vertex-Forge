import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceLifecycleService } from '../workspaceLifecycleService';
import { DesktopBridge } from '../desktopBridge';
import { FileNode } from '../../types/ide';

vi.mock('../desktopBridge', () => ({
  DesktopBridge: {
    currentWorkspacePath: '/test/workspace',
    setWorkspacePath: vi.fn(),
    getWorkspaceTree: vi.fn().mockResolvedValue([
      { name: 'src', path: 'src', type: 'folder', children: [{ name: 'App.tsx', path: 'src/App.tsx', type: 'file' }] },
      { name: 'package.json', path: 'package.json', type: 'file' },
    ]),
    readFile: vi.fn().mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-app', version: '1.0.0' }));
      if (path === 'src/App.tsx') return Promise.resolve('export default function App() {}');
      return Promise.reject(new Error('File not found'));
    }),
    attachVFS: vi.fn(),
    getGitStatus: vi.fn().mockResolvedValue({ isRepo: true, branch: 'main', ahead: 0, behind: 0 }),
  },
}));

describe('WorkspaceLifecycleService', () => {
  const sampleNodes: FileNode[] = [
    {
      id: 'node-1',
      name: 'src',
      path: 'src',
      type: 'folder',
      children: [
        { id: 'node-2', name: 'App.tsx', path: 'src/App.tsx', type: 'file' },
        { id: 'node-3', name: 'main.tsx', path: 'src/main.tsx', type: 'file' },
      ],
    },
    { id: 'node-4', name: 'package.json', path: 'package.json', type: 'file' },
  ];

  it('correctly flattens hierarchical file trees', () => {
    const flat = WorkspaceLifecycleService.flattenTree(sampleNodes);
    expect(flat).toContain('src');
    expect(flat).toContain('src/App.tsx');
    expect(flat).toContain('src/main.tsx');
    expect(flat).toContain('package.json');
    expect(flat.length).toBe(4);
  });

  it('detects presence of file in nested tree', () => {
    expect(WorkspaceLifecycleService.hasFileInTree(sampleNodes, 'package.json')).toBe(true);
    expect(WorkspaceLifecycleService.hasFileInTree(sampleNodes, 'src/App.tsx')).toBe(true);
    expect(WorkspaceLifecycleService.hasFileInTree(sampleNodes, 'nonexistent.ts')).toBe(false);
  });

  it('converts raw desktop files into strongly-typed FileNodes', () => {
    const raw = [
      { name: 'public', relativePath: 'public', type: 'folder', children: [{ name: 'favicon.ico', path: 'public/favicon.ico', type: 'file' }] },
    ];
    const converted = WorkspaceLifecycleService.convertToFileNodes(raw);
    expect(converted[0].name).toBe('public');
    expect(converted[0].children?.[0].path).toBe('public/favicon.ico');
    expect(converted[0].id).toBeDefined();
  });

  it('finds the first available file in a tree', () => {
    const first = WorkspaceLifecycleService.findFirstFile(sampleNodes);
    expect(first).toBe('src/App.tsx');
  });

  it('creates new project template with archetype configuration', () => {
    const proj = WorkspaceLifecycleService.createNewProject('TestApp', 'A test application', 'fullstack-saas');
    expect(proj.name).toBe('TestApp');
    expect(proj.techStack.archetype).toBe('fullstack-saas');
    expect(proj.rootFiles.length).toBe(2);
    expect(proj.memory.purpose).toBe('A test application');
  });

  it('opens a local folder and constructs workspace services', async () => {
    const onLog = vi.fn();
    const result = await WorkspaceLifecycleService.openLocalFolder('/test/workspace', onLog);
    expect(result.project).toBeDefined();
    expect(result.services.vfs).toBeDefined();
    expect(result.openTabs.length).toBeGreaterThan(0);
    expect(result.gitProfile.isRepo).toBe(true);
    expect(onLog).toHaveBeenCalled();
  });
});
