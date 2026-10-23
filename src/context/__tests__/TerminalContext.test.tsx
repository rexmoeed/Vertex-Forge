import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TerminalProvider, useTerminal } from '../TerminalContext';

describe('TerminalContext', () => {
  it('initializes with default terminal history lines', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TerminalProvider>{children}</TerminalProvider>
    );

    const { result } = renderHook(() => useTerminal(), { wrapper });
    expect(result.current.terminalHistory.length).toBeGreaterThan(0);
    expect(result.current.terminalHistory[0].text).toContain('Vertex Forge Terminal');
  });

  it('runs terminal command and appends output lines', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TerminalProvider>{children}</TerminalProvider>
    );

    const { result } = renderHook(() => useTerminal(), { wrapper });
    const initialLen = result.current.terminalHistory.length;

    await act(async () => {
      await result.current.runCommand('echo "Hello World"');
    });

    expect(result.current.terminalHistory.length).toBeGreaterThan(initialLen);
  });

  it('clears terminal history', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TerminalProvider>{children}</TerminalProvider>
    );

    const { result } = renderHook(() => useTerminal(), { wrapper });
    act(() => {
      result.current.clearTerminal();
    });

    expect(result.current.terminalHistory).toHaveLength(0);
  });

  it('runs lint and updates problems diagnostics', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TerminalProvider>{children}</TerminalProvider>
    );

    const { result } = renderHook(() => useTerminal(), { wrapper });
    act(() => {
      result.current.runLint();
    });

    expect(Array.isArray(result.current.problems)).toBe(true);
  });
});
