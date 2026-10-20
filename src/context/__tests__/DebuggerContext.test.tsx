import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DebuggerProvider, useDebugger } from '../DebuggerContext';
import { VirtualFileSystem } from '../../services/virtualFs';

const DebuggerConsumer: React.FC = () => {
  const {
    debugBreakpoints,
    toggleBreakpoint,
    debugSession,
  } = useDebugger();

  return (
    <div>
      <div data-testid="session-status">{debugSession ? debugSession.status : 'idle'}</div>
      <div data-testid="bp-count">{debugBreakpoints.length}</div>
      <button onClick={() => toggleBreakpoint('src/index.ts', 15)}>Toggle BP</button>
    </div>
  );
};

describe('DebuggerContext Layer', () => {
  it('manages DAP breakpoints and session state', () => {
    const vfs = new VirtualFileSystem([]);

    render(
      <DebuggerProvider vfs={vfs}>
        <DebuggerConsumer />
      </DebuggerProvider>
    );

    expect(screen.getByTestId('session-status').textContent).toBe('idle');
    expect(screen.getByTestId('bp-count').textContent).toBe('0');

    // Add breakpoint
    act(() => {
      screen.getByText('Toggle BP').click();
    });

    expect(screen.getByTestId('bp-count').textContent).toBe('1');

    // Toggle off
    act(() => {
      screen.getByText('Toggle BP').click();
    });

    expect(screen.getByTestId('bp-count').textContent).toBe('0');
  });
});
