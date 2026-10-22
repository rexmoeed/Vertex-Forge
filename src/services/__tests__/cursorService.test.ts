import { describe, it, expect, beforeEach } from 'vitest';
import { CursorService } from '../cursorService';
import { VirtualFileSystem } from '../virtualFs';
import { FileNode } from '../../types/ide';

describe('CursorService', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    const initialFiles: FileNode[] = [
      {
        id: '1',
        name: 'src',
        path: 'src',
        type: 'folder',
        children: [
          {
            id: '2',
            name: 'App.tsx',
            path: 'src/App.tsx',
            type: 'file',
            content: 'export const App = () => <div>Hello</div>;',
          },
        ],
      },
      {
        id: '3',
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        content: '{"name": "test"}',
      },
    ];
    vfs = new VirtualFileSystem(initialFiles);
  });

  it('generates available @ context options including codebase, git, and workspace files', () => {
    const options = CursorService.getAvailableContextOptions(vfs, 'src/App.tsx', ['npm run build: success']);
    expect(options.length).toBeGreaterThanOrEqual(4);

    const codebaseOpt = options.find(o => o.type === 'codebase');
    expect(codebaseOpt).toBeDefined();
    expect(codebaseOpt?.label).toBe('@Codebase');

    const fileOpt = options.find(o => o.label === '@src/App.tsx');
    expect(fileOpt).toBeDefined();
    expect(fileOpt?.type).toBe('file');

    const terminalOpt = options.find(o => o.type === 'terminal');
    expect(terminalOpt).toBeDefined();
  });

  it('synthesizes terminal commands from natural language query', () => {
    expect(CursorService.synthesizeTerminalCommand('install react router')).toContain('npm install');
    expect(CursorService.synthesizeTerminalCommand('run vitest test suite')).toContain('npm test');
    expect(CursorService.synthesizeTerminalCommand('start dev server')).toContain('npm run dev');
    expect(CursorService.synthesizeTerminalCommand('create git branch feature')).toContain('git checkout -b');
  });

  it('returns default .cursorrules content with established guidelines', () => {
    const rules = CursorService.getDefaultCursorRules();
    expect(rules).toContain('# Project Cursor Rules (.cursorrules)');
    expect(rules).toContain('React 19 + TypeScript');
    expect(rules).toContain('code_style');
  });

  it('provides ghost text suggestions based on code context', () => {
    const interfaceSuggestion = CursorService.getGhostTextSuggestion('interface My', 'ts');
    expect(interfaceSuggestion).toContain('Props {');

    const fnSuggestion = CursorService.getGhostTextSuggestion('function submit', 'ts');
    expect(fnSuggestion).toContain('handleSubmit');

    const nullSuggestion = CursorService.getGhostTextSuggestion('let x = 1;', 'ts');
    expect(nullSuggestion).toBeNull();
  });
  it('composes multi-file auth changes when prompt mentions authentication', async () => {
    const result = await CursorService.composeMultiFileChanges(
      'Implement user authentication with JWT session context',
      vfs,
      []
    );

    expect(result.changes.length).toBeGreaterThanOrEqual(2);
    expect(result.changes.some(c => c.filePath === 'src/types/auth.ts')).toBe(true);
    expect(result.changes.some(c => c.filePath === 'src/context/AuthContext.tsx')).toBe(true);
    expect(result.message).toContain('Composer');
  });

  it('composes test suite when prompt mentions test creation', async () => {
    const result = await CursorService.composeMultiFileChanges(
      'Write comprehensive unit tests for core service',
      vfs,
      []
    );

    expect(result.changes.length).toBeGreaterThanOrEqual(1);
    expect(result.changes.some(c => c.filePath.includes('.test.ts'))).toBe(true);
  });

  it('composes feature enhancement modifying primary workspace file', async () => {
    const result = await CursorService.composeMultiFileChanges(
      'Add dark theme toggle to dashboard',
      vfs,
      []
    );

    expect(result.changes.length).toBeGreaterThanOrEqual(1);
    expect(result.changes[0].action).toBe('modify');
  });
});
