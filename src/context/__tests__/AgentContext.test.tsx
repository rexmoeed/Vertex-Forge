import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AgentProvider, useAgent } from '../AgentContext';

vi.mock('../../services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AgentContext & AgentProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if useAgent is used outside of AgentProvider', () => {
    expect(() => renderHook(() => useAgent())).toThrow('useAgent must be used within an AgentProvider');
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useAgent(), {
      wrapper: ({ children }) => <AgentProvider>{children}</AgentProvider>,
    });

    expect(result.current.autonomyMode).toBe('supervised');
    expect(result.current.activeAgent).toBe('Architect');
    expect(result.current.orchestratorStatus).toBe('idle');
    expect(result.current.taskPlan).toEqual([]);
    expect(result.current.currentTaskIndex).toBe(0);
    expect(result.current.autonomousPlan).toBeNull();
    expect(result.current.agentLogs.length).toBeGreaterThan(0);
  });

  it('updates autonomy mode and active agent', () => {
    const { result } = renderHook(() => useAgent(), {
      wrapper: ({ children }) => <AgentProvider>{children}</AgentProvider>,
    });

    act(() => {
      result.current.setAutonomyMode('autonomous');
      result.current.setActiveAgent('Developer');
      result.current.setOrchestratorStatus('executing');
    });

    expect(result.current.autonomyMode).toBe('autonomous');
    expect(result.current.activeAgent).toBe('Developer');
    expect(result.current.orchestratorStatus).toBe('executing');
  });

  it('logs agent actions and stores in history', () => {
    const { result } = renderHook(() => useAgent(), {
      wrapper: ({ children }) => <AgentProvider>{children}</AgentProvider>,
    });

    act(() => {
      result.current.logAgentAction('Developer', 'Writing unit test', 'success', 'details here', 'src/test.ts');
    });

    const latest = result.current.agentLogs[0];
    expect(latest.agent).toBe('Developer');
    expect(latest.action).toBe('Writing unit test');
    expect(latest.status).toBe('success');
    expect(latest.targetFile).toBe('src/test.ts');
  });

  it('clears agent logs on command', () => {
    const { result } = renderHook(() => useAgent(), {
      wrapper: ({ children }) => <AgentProvider>{children}</AgentProvider>,
    });

    act(() => {
      result.current.clearAgentLogs();
    });

    expect(result.current.agentLogs).toEqual([]);
  });
});
