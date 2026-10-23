import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WorkspaceProvider, useWorkspace } from '../WorkspaceContext';

describe('WorkspaceContext', () => {
  it('initializes with default active project', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider>{children}</WorkspaceProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });
    expect(result.current.projects.length).toBeGreaterThan(0);
    expect(result.current.activeProject.name).toBe('Vertex Forge');
  });

  it('switches between projects in workspace', () => {
    const customProjects = [
      { id: 'proj-1', name: 'Alpha', description: 'Alpha App', techStack: { framework: 'React', language: 'TypeScript' } as any, rootFiles: [] },
      { id: 'proj-2', name: 'Beta', description: 'Beta App', techStack: { framework: 'React', language: 'TypeScript' } as any, rootFiles: [] },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider initialProjects={customProjects}>{children}</WorkspaceProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });
    expect(result.current.activeProject.id).toBe('proj-1');

    act(() => {
      result.current.switchProject('proj-2');
    });

    expect(result.current.activeProject.id).toBe('proj-2');
  });

  it('creates a new project in the workspace', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider>{children}</WorkspaceProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    await act(async () => {
      await result.current.createNewProject('Gamma', 'Next-Gen App', 'react-spa');
    });

    expect(result.current.activeProject.name).toBe('Gamma');
    expect(result.current.projects.some(p => p.name === 'Gamma')).toBe(true);
  });

  it('manages dev server process lifecycle', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider>{children}</WorkspaceProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });
    expect(result.current.devServerProcess).toBeNull();

    await act(async () => {
      await result.current.startDevServer();
    });

    expect(result.current.devServerProcess).not.toBeNull();
    expect(result.current.devServerProcess?.port).toBe(5173);

    await act(async () => {
      await result.current.stopDevServer();
    });

    expect(result.current.devServerProcess?.status).toBe('stopped');
  });
});
