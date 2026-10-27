import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJulesCloudMission } from '../useJulesCloudMission';

vi.mock('../../services/julesService', () => ({
  julesService: {
    listSources: vi.fn(async () => [
      {
        name: 'sources/github/rexmoeed/Vertex-Forge',
        id: 'github/rexmoeed/Vertex-Forge',
        githubRepo: {
          owner: 'rexmoeed',
          repo: 'Vertex-Forge',
          defaultBranch: { displayName: 'main' },
        },
      },
    ]),
    listSessions: vi.fn(async () => [
      {
        id: 'sess-1',
        title: 'Mission 1',
        prompt: 'Fix tests',
        state: 'COMPLETED',
      },
    ]),
    createSession: vi.fn(async (params: any) => ({
      id: 'sess-new',
      title: params.title,
      prompt: params.prompt,
      state: 'AWAITING_PLAN_APPROVAL',
      sourceContext: { source: params.source },
    })),
    approvePlan: vi.fn(async () => true),
    getActivities: vi.fn(async () => []),
    getSession: vi.fn(async () => null),
  },
}));

describe('useJulesCloudMission hook', () => {
  it('loads sources and sessions when opened', async () => {
    const { result } = renderHook(() => useJulesCloudMission({ isOpen: true }));

    await vi.waitFor(() => {
      expect(result.current.sources.length).toBe(1);
      expect(result.current.selectedSource).toBe('sources/github/rexmoeed/Vertex-Forge');
      expect(result.current.historySessions.length).toBe(1);
    });
  });

  it('handles mission launch and validation', async () => {
    const { result } = renderHook(() => useJulesCloudMission({ isOpen: true }));

    await vi.waitFor(() => {
      expect(result.current.selectedSource).toBe('sources/github/rexmoeed/Vertex-Forge');
    });

    // Attempt launch with empty prompt
    await act(async () => {
      const mockEvent = { preventDefault: vi.fn() } as any;
      await result.current.handleLaunchMission(mockEvent);
    });

    expect(result.current.error).toContain('Please provide instructions');

    // Fill in prompt and launch
    act(() => {
      result.current.setMissionPrompt('Refactor database queries');
      result.current.setMissionTitle('DB Refactor');
    });

    await act(async () => {
      const mockEvent = { preventDefault: vi.fn() } as any;
      await result.current.handleLaunchMission(mockEvent);
    });

    expect(result.current.activeTab).toBe('monitor');
    expect(result.current.currentSession?.title).toBe('DB Refactor');
  });
});
