import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentBriefTab } from '../AgentBriefTab';
import { AgentDesignTab } from '../AgentDesignTab';
import { AgentArchitectureTab } from '../AgentArchitectureTab';
import { AgentCodeTab } from '../AgentCodeTab';

describe('Agent Deliverables Tab Subcomponents', () => {
  it('renders AgentBriefTab with project name and triggers openFile', () => {
    const openFile = vi.fn();
    render(<AgentBriefTab activeProject={{ name: 'Demo Forge' }} openFile={openFile} />);
    expect(screen.getByText('Demo Forge')).toBeDefined();
    const btn = screen.getByText('Open Domain Schema');
    fireEvent.click(btn);
    expect(openFile).toHaveBeenCalledWith('src/types/task.ts');
  });

  it('renders AgentDesignTab and triggers open full studio', () => {
    const setActiveView = vi.fn();
    render(<AgentDesignTab setActiveView={setActiveView} />);
    const btn = screen.getByText('Open Full Design System Studio');
    fireEvent.click(btn);
    expect(setActiveView).toHaveBeenCalledWith('design-system');
  });

  it('renders AgentArchitectureTab and triggers open server.ts', () => {
    const openFile = vi.fn();
    render(<AgentArchitectureTab openFile={openFile} />);
    const btn = screen.getByText('Inspect server.ts API');
    fireEvent.click(btn);
    expect(openFile).toHaveBeenCalledWith('server.ts');
  });

  it('renders AgentCodeTab with state management blueprint', () => {
    const openFile = vi.fn();
    render(<AgentCodeTab vfs={{ getAllFiles: () => new Map([['src/App.tsx', {}]]) }} openFile={openFile} />);
    expect(screen.getByText('App.tsx')).toBeDefined();
  });
});
