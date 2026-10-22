import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AgentDeliverablesPanel, AgentArtifactTabId } from '../AgentDeliverablesPanel';

afterEach(cleanup);

describe('AgentDeliverablesPanel Component', () => {
  const defaultProps = {
    activeArtifactTab: 'brief' as AgentArtifactTabId,
    setActiveArtifactTab: vi.fn(),
    activeProject: { name: 'Demo Workspace' },
    tasks: [
      { id: 'task-1', title: 'Setup database schema' },
      { id: 'task-2', title: 'Configure authentication' },
    ],
    reports: {},
    testResults: null,
    failedTests: 0, setActiveView: vi.fn(),
    runTests: vi.fn(),
    triggerSelfHealDebug: vi.fn(),
    vfs: {
      getAllFiles: () => new Map([
        ['src/App.tsx', { content: 'export default App;' }],
        ['src/server.ts', { content: 'console.log("server");' }],
      ]),
    },
    openFile: vi.fn(),
  };

  it('renders deliverable category navigation tabs and workspace name', () => {
    render(<AgentDeliverablesPanel {...defaultProps} />);
    expect(screen.getByText(/Product Brief & Scope/i)).toBeDefined();
    expect(screen.getByText(/UI Design Specs & Tokens/i)).toBeDefined();
    expect(screen.getByText(/System Architecture & APIs/i)).toBeDefined();
    expect(screen.getByText(/Workspace: Demo Workspace/i)).toBeDefined();
  });

  it('calls setActiveArtifactTab when a tab button is clicked', () => {
    const setActiveArtifactTab = vi.fn();
    render(<AgentDeliverablesPanel {...defaultProps} setActiveArtifactTab={setActiveArtifactTab} />);

    const designTab = screen.getByText(/UI Design Specs & Tokens/i);
    fireEvent.click(designTab);
    expect(setActiveArtifactTab).toHaveBeenCalledWith('design');
  });

  it('renders product brief deliverables when activeArtifactTab is brief', () => {
    render(<AgentDeliverablesPanel {...defaultProps} activeArtifactTab="brief" />);
    expect(screen.getByText(/Principal Product Designer Deliverables/i)).toBeDefined();
    expect(screen.getByText(/Approved Baseline/i)).toBeDefined();
  });

  it('renders code contracts and files when activeArtifactTab is code', () => {
    const openFile = vi.fn();
    render(
      <AgentDeliverablesPanel
        {...defaultProps}
        activeArtifactTab="code"
        openFile={openFile}
      />
    );
    expect(screen.getByText(/Frontend & Backend Engineering Contracts/i)).toBeDefined();
  });
});
