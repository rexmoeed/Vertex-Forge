import { describe, it, expect, beforeEach } from 'vitest';
import { ConcreteBugDetective, bugDetective } from '../bugDetectiveService';
import { VirtualFileSystem } from '../virtualFs';

describe('ConcreteBugDetective Service', () => {
  let detective: ConcreteBugDetective;
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem([]);
    vfs.writeFile('src/App.tsx', 'import React from "react"; export const App = () => <div>App</div>;');
    vfs.writeFile('src/services/apiClient.ts', 'export const fetchData = async () => fetch("/api/data");');
    vfs.writeFile('server/routes/api.ts', 'export function createRouter() {}');
    detective = new ConcreteBugDetective(vfs);
  });

  it('runs investigation across UI, state, service, and backend layers', async () => {
    const investigation = await detective.investigate({
      workspaceId: 'ws-1',
      environment: 'development',
      activeFile: 'src/App.tsx',
      description: 'TypeError: Cannot read properties of undefined',
      error: {
        message: 'TypeError: Cannot read properties of undefined (reading "data")',
        line: 42,
      },
    });

    expect(investigation.id).toBeDefined();
    expect(investigation.trace.length).toBeGreaterThan(0);
    expect(investigation.hypothesis.length).toBeGreaterThan(0);
    expect(investigation.rootCause).toBeDefined();
    expect(investigation.proposedFixes.length).toBeGreaterThan(0);

    const hasUiLayer = investigation.trace.some(t => t.layer === 'ui');
    expect(hasUiLayer).toBe(true);

    const hasServiceLayer = investigation.trace.some(t => t.layer === 'service');
    expect(hasServiceLayer).toBe(true);

    const hasBackendLayer = investigation.trace.some(t => t.layer === 'backend');
    expect(hasBackendLayer).toBe(true);
  });

  it('uses default singleton bugDetective with setVFS', async () => {
    bugDetective.setVFS(vfs);
    const investigation = await bugDetective.investigate({
      workspaceId: 'ws-1',
      environment: 'development',
      activeFile: 'src/App.tsx',
      description: 'Component crash',
    });
    expect(investigation.status).toBe('root-cause-found');
    expect(investigation.summary).toBeDefined();
  });
});
