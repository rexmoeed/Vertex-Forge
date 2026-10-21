import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IDEProvider, useIDE } from '../IDEContext';
import { ThemeProvider } from '../ThemeContext';

vi.mock('../../services/desktopBridge', () => ({
  DesktopBridge: {
    currentWorkspacePath: '/test/workspace',
    executeCommand: vi.fn().mockResolvedValue({ exitCode: 0, stdout: 'ok', stderr: '', durationMs: 10 }),
    writeFile: vi.fn().mockResolvedValue(true),
    readFile: vi.fn().mockResolvedValue('test content'),
    attachVFS: vi.fn(),
    getGitStatus: vi.fn().mockResolvedValue({ isRepo: true, branch: 'main', ahead: 0, behind: 0 }),
  },
}));

describe('IDEContext Composite Architecture', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider>
      <IDEProvider>{children}</IDEProvider>
    </ThemeProvider>
  );

  it('provides all modular IDE state and operations', () => {
    const { result } = renderHook(() => useIDE(), { wrapper });

    expect(result.current.projects).toBeDefined();
    expect(result.current.activeProject).toBeDefined();
    expect(result.current.activeView).toBe('editor');
    expect(result.current.autonomyMode).toBe('supervised');
    expect(result.current.vfs).toBeDefined();
    expect(typeof result.current.openFile).toBe('function');
    expect(typeof result.current.updateFileContent).toBe('function');
    expect(typeof result.current.runCommand).toBe('function');
  });

  it('supports creating a new project through lifecycle service', async () => {
    const { result } = renderHook(() => useIDE(), { wrapper });

    await act(async () => {
      await result.current.createNewProject('MyNewApp', 'Super app');
    });

    expect(result.current.activeProject.name).toBe('MyNewApp');
    expect(result.current.projects.some(p => p.name === 'MyNewApp')).toBe(true);
  });

  it('manages active file and buffer updates', async () => {
    const { result } = renderHook(() => useIDE(), { wrapper });

    await act(async () => {
      await result.current.createFileOrFolder('src/test.ts', 'file', 'const val = 42;');
    });

    expect(result.current.activeFile).toBe('src/test.ts');
    expect(result.current.activeFileContent).toBe('const val = 42;');

    act(() => {
      result.current.updateFileContent('const val = 100;');
    });

    expect(result.current.activeFileContent).toBe('const val = 100;');
  });

  it('cycles themes cleanly through composite layout', () => {
    const { result } = renderHook(() => useIDE(), { wrapper });
    expect(result.current.theme).toBeDefined();

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBeDefined();
  });
});
