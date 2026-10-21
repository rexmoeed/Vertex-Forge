import { describe, it, expect, beforeEach } from 'vitest';
import { AIProjectNavigator } from '../aiNavigator';
import { CodebaseIndexer } from '../codebaseIndexer';
import { VirtualFileSystem } from '../virtualFs';
import { FileNode } from '../../types/ide';

describe('AIProjectNavigator Service', () => {
  let vfs: VirtualFileSystem;
  let indexer: CodebaseIndexer;
  let navigator: AIProjectNavigator;

  const sampleFiles: FileNode[] = [
    {
      id: 'f-app',
      name: 'App.tsx',
      path: 'src/App.tsx',
      type: 'file',
      content: `
import React from 'react';
import { UserService } from './services/userService';

export function App() {
  return <div>App Content</div>;
}
      `,
    },
    {
      id: 'f-user',
      name: 'userService.ts',
      path: 'src/services/userService.ts',
      type: 'file',
      content: `
export class UserService {
  getUser() { return { id: 1, name: 'Alice' }; }
}
      `,
    },
  ];

  beforeEach(() => {
    vfs = new VirtualFileSystem(sampleFiles);
    indexer = new CodebaseIndexer(vfs);
    navigator = new AIProjectNavigator(vfs, indexer);
  });

  it('explains features by generating inspection trails and hypotheses', () => {
    const result = navigator.explainFeature('user management and profile loading');
    expect(result.query).toBe('user management and profile loading');
    expect(result.inspectedFiles.length).toBeGreaterThan(0);
    expect(result.explanation).toBeDefined();
    expect(result.architectureSummary).toBeDefined();
  });

  it('plans multi-file code modifications from user instructions', () => {
    const changes = navigator.planMultiFileChanges('add email field to user profile and render in app');
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].action).toBeDefined();
    expect(changes[0].filePath).toBeDefined();
    expect(changes[0].newContent).toBeDefined();
  });

  it('detects broken or unresolvable imports', () => {
    vfs.writeFile('src/broken.ts', "import { Missing } from './nonexistentFile';");
    indexer.invalidate();
    const broken = navigator.findBrokenImports();
    expect(broken.length).toBeGreaterThan(0);
    expect(broken.some(b => b.importPath.includes('nonexistentFile'))).toBe(true);
  });

  it('updates dependencies when VFS is altered', () => {
    const newVfs = new VirtualFileSystem([]);
    const newIndexer = new CodebaseIndexer(newVfs);
    navigator.updateDependencies(newVfs, newIndexer);
    const broken = navigator.findBrokenImports();
    expect(broken.length).toBe(0);
  });
});
