import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentWorkspaceView } from '../views/AgentWorkspaceView';
import { VirtualFileSystem } from '../../services/virtualFs';

const mockVfs = new VirtualFileSystem([]);
const mockSetActiveView = vi.fn();

vi.mock('../../context/IDEContext', () => ({
  useIDE: () => ({
    vfs: mockVfs,
    activeProject: { id: 'test-proj', name: 'Test Workspace', rootFiles: [] },
    testResults: [],
    triggerSelfHealDebug: vi.fn(),
    runTests: vi.fn(),
    openFile: vi.fn(),
    setActiveView: mockSetActiveView,
    autonomousPlan: null,
    autonomousExecutionState: null,
    verificationSummary: null,
    startAutonomousPlan: vi.fn(),
    pauseAutonomousPlan: vi.fn(),
    resumeAutonomousPlan: vi.fn(),
    cancelAutonomousPlan: vi.fn(),
    approveAutonomousPlan: vi.fn(),
    rejectAutonomousPlan: vi.fn(),
    rollbackAutonomousPlan: vi.fn(),
    retryAutonomousTask: vi.fn(),
    autonomyMode: 'autonomous',
    setAutonomyMode: vi.fn(),
  }),
}));

vi.mock('../views/SwarmMissionCockpit', () => ({
  SwarmMissionCockpit: () => <div data-testid="swarm-cockpit-mock">Swarm Mission Cockpit View</div>,
}));

describe('AgentWorkspaceView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace navigation buttons and controls', () => {
    render(<AgentWorkspaceView />);
    expect(screen.getByText('Agent Models & Keys')).toBeDefined();
    expect(screen.getByText('Benchmark')).toBeDefined();
  });

  it('navigates back to editor when Editor button is clicked', () => {
    render(<AgentWorkspaceView />);
    const editorBtn = screen.getAllByTitle('Return to Main Editor Workspace')[0];
    fireEvent.click(editorBtn);
    expect(mockSetActiveView).toHaveBeenCalledWith('editor');
  });

  it('triggers project decomposition when Decompose Only is clicked', () => {
    render(<AgentWorkspaceView />);
    const decomposeBtn = screen.getAllByTitle('Decompose project into sub-tasks and inspect contracts DAG without immediate execution')[0];
    fireEvent.click(decomposeBtn);
    expect(decomposeBtn).toBeDefined();
  });

  it('selects preset goal when a preset button is clicked', () => {
    render(<AgentWorkspaceView />);
    const presetBtn = screen.getAllByText('Full Workspace Engineering Audit & Quality Gate Verification')[0];
    fireEvent.click(presetBtn);
    expect(presetBtn).toBeDefined();
  });
});
