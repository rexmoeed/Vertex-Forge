import { describe, it, expect, beforeEach } from 'vitest';
import { CodebaseIndexer } from '../codebaseIndexer';
import { VirtualFileSystem } from '../virtualFs';
import { FileNode } from '../../types/ide';

describe('CodebaseIndexer Service', () => {
  let vfs: VirtualFileSystem;
  let indexer: CodebaseIndexer;

  const mockFiles: FileNode[] = [
    {
      id: 'f1',
      name: 'button.tsx',
      path: 'src/components/button.tsx',
      type: 'file',
      content: `
import React from 'react';
import { Theme } from '../types/theme';

export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
      `,
    },
    {
      id: 'f2',
      name: 'App.tsx',
      path: 'src/App.tsx',
      type: 'file',
      content: `
import React from 'react';
import { Button } from './components/button';

export function App() {
  return (
    <div>
      <h1>Vertex Forge</h1>
      <Button label="Click Me" onClick={() => console.log('clicked')} />
    </div>
  );
}
      `,
    },
  ];

  beforeEach(() => {
    vfs = new VirtualFileSystem(mockFiles);
    indexer = new CodebaseIndexer(vfs);
  });

  it('builds index with symbols, imports, and routes', () => {
    const index = indexer.getIndex();
    expect(index.symbols.length).toBeGreaterThan(0);
    expect(index.imports.length).toBeGreaterThan(0);
    expect(index.lastUpdated).toBeGreaterThan(0);
  });

  it('finds symbols by identifier name', () => {
    const sym = indexer.findSymbol('Button');
    expect(sym).toBeDefined();
    expect(sym?.name).toBe('Button');
    expect(sym?.filePath).toBe('src/components/button.tsx');
  });

  it('finds components by name', () => {
    const comp = indexer.findComponent('App');
    expect(comp).toBeDefined();
    expect(comp?.filePath).toBe('src/App.tsx');
  });

  it('computes forward dependencies for a file', () => {
    const deps = indexer.getDependencies('src/App.tsx');
    expect(deps.some(d => d.includes('button'))).toBe(true);
  });

  it('computes reverse dependents for a file', () => {
    const dependents = indexer.getDependents('src/components/button.tsx');
    expect(dependents.some(d => d.includes('App.tsx'))).toBe(true);
  });

  it('retrieves relevant file context for engineering goals', () => {
    const context = indexer.retrieveContextForGoal('button click interaction');
    expect(context.length).toBeGreaterThan(0);
    expect(context.some(c => c.path.includes('button'))).toBe(true);
  });

  it('invalidates cache when VFS is updated', () => {
    const initialIndex = indexer.getIndex();
    indexer.invalidate();
    const nextVfs = new VirtualFileSystem([]);
    indexer.updateVFS(nextVfs);
    const newIndex = indexer.getIndex();
    expect(newIndex.symbols.length).toBe(0);
    expect(newIndex).not.toBe(initialIndex);
  });
});
