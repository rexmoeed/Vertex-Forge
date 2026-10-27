import { describe, it, expect } from 'vitest';
import { backendExpress, backendFastAPI, backendGo, allBackendTemplates } from '../backendTemplates';
import { webReactVite, webNextJs } from '../webTemplates.react';
import { ScaffoldingContext } from '../../../types/scaffolding';

describe('Modular Templates Suite', () => {
  const dummyCtx: ScaffoldingContext = {
    projectName: 'DemoApp',
    projectDescription: 'Demo Application',
    destinationPath: '/workspaces/demo',
    parentDir: '/workspaces',
    templateId: 'test',
    category: 'web',
    packageManager: 'npm',
    architecture: 'modular',
    initGit: false,
    selectedLibraries: [],
  };

  it('exports all 10 backend templates in allBackendTemplates array', () => {
    expect(allBackendTemplates.length).toBe(10);
    const ids = allBackendTemplates.map(t => t.id);
    expect(ids).toContain('backend-express');
    expect(ids).toContain('backend-fastapi');
    expect(ids).toContain('backend-go');
  });

  it('generates valid express manifest', () => {
    const files = backendExpress.generateManifest(dummyCtx);
    const pkg = files.find(f => f.path === 'package.json');
    expect(pkg).toBeDefined();
    expect(pkg?.content).toContain('"express":');
    expect(pkg?.content).toContain('"demoapp"');
  });

  it('generates valid FastAPI manifest', () => {
    const files = backendFastAPI.generateManifest(dummyCtx);
    const req = files.find(f => f.path === 'requirements.txt');
    expect(req).toBeDefined();
    expect(req?.content).toContain('fastapi');
  });

  it('generates React Vite template manifest', () => {
    const files = webReactVite.generateManifest(dummyCtx);
    expect(files.some(f => f.path === 'package.json')).toBe(true);
    expect(files.some(f => f.path === 'src/App.tsx')).toBe(true);
  });

  it('generates Next.js template manifest', () => {
    const files = webNextJs.generateManifest(dummyCtx);
    expect(files.some(f => f.path === 'src/app/layout.tsx')).toBe(true);
  });
});
