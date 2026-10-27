import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentWorkspace } from '../useAgentWorkspace';
import { VirtualFileSystem } from '../../services/virtualFs';

describe('useAgentWorkspace Hook', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    vfs = new VirtualFileSystem([]);
  });

  it('initializes with default 10 leads, idle status, and brief tab', () => {
    const { result } = renderHook(() => useAgentWorkspace(vfs));

    expect(result.current.leads.length).toBe(10);
    expect(result.current.activeArtifactTab).toBe('brief');
    expect(result.current.parallelConcurrency).toBeGreaterThanOrEqual(2);
    expect(result.current.isParallelRunning).toBe(false);
  });

  it('decomposes project into sub-tasks when triggered', () => {
    const { result } = renderHook(() => useAgentWorkspace(vfs, { name: 'TestApp', path: '/test' } as any));

    act(() => {
      result.current.handleDecomposeProject('Build authentication endpoints');
    });

    expect(result.current.tasks.length).toBeGreaterThan(0);
    expect(result.current.activeArtifactTab).toBe('contracts');
  });

  it('updates parallel concurrency thread count', () => {
    const { result } = renderHook(() => useAgentWorkspace(vfs));

    act(() => {
      result.current.setParallelConcurrency(4);
    });

    expect(result.current.parallelConcurrency).toBe(4);
  });

  it('manages lead selection and active artifact tab', () => {
    const { result } = renderHook(() => useAgentWorkspace(vfs));
    const targetLead = result.current.leads[1];

    act(() => {
      result.current.setSelectedLead(targetLead);
      result.current.setActiveArtifactTab('qa');
    });

    expect(result.current.selectedLead?.role).toBe(targetLead.role);
    expect(result.current.activeArtifactTab).toBe('qa');
  });

  it('resets all tasks and sub-agent contracts', () => {
    const { result } = renderHook(() => useAgentWorkspace(vfs, { name: 'TestApp' } as any));

    act(() => {
      result.current.handleDecomposeProject();
    });
    expect(result.current.tasks.length).toBeGreaterThan(0);

    act(() => {
      result.current.handleResetTasks();
    });
    expect(result.current.tasks.length).toBe(0);
  });
});
