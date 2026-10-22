import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { GitBranchesTab } from '../GitBranchesTab';
import { GitBranch } from '../../../types/gitWorkflow';

describe('GitBranchesTab Component', () => {
  afterEach(cleanup);
  const mockBranches: GitBranch[] = [
    {
      name: 'main',
      isCurrent: true, isRemote: false,
      commitHash: 'abc1234',
      commitMessage: 'initial main commit',
      ahead: 0,
      behind: 0,
    },
    {
      name: 'feature/agent-swarm',
      isCurrent: false, isRemote: false,
      commitHash: 'def5678',
      commitMessage: 'feat: swarm orchestrator',
      ahead: 2,
      behind: 0,
    },
  ];

  it('renders branch list with HEAD marker on current branch', () => {
    render(
      <GitBranchesTab
        branches={mockBranches}
        currentBranch="main"
        onCreateBranch={vi.fn()}
        onSwitchBranch={vi.fn()}
        onDeleteBranch={vi.fn()}
        onMerge={vi.fn()}
      />
    );

    expect(screen.getByText('Branches (2)')).toBeDefined();
    expect(screen.getByText('main')).toBeDefined();
    expect(screen.getByText('HEAD')).toBeDefined();
    expect(screen.getByText('feature/agent-swarm')).toBeDefined();
  });

  it('triggers onCreateBranch when submitting new branch input', () => {
    const onCreateBranch = vi.fn();
    render(
      <GitBranchesTab
        branches={mockBranches}
        currentBranch="main"
        onCreateBranch={onCreateBranch}
        onSwitchBranch={vi.fn()}
        onDeleteBranch={vi.fn()}
        onMerge={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('feature/branch-name');
    fireEvent.change(input, { target: { value: 'fix/security-scanner' } });

    const createBtn = screen.getByText('Create');
    fireEvent.click(createBtn);

    expect(onCreateBranch).toHaveBeenCalledWith('fix/security-scanner');
  });

  it('triggers onSwitchBranch when clicking Checkout', () => {
    const onSwitchBranch = vi.fn();
    render(
      <GitBranchesTab
        branches={mockBranches}
        currentBranch="main"
        onCreateBranch={vi.fn()}
        onSwitchBranch={onSwitchBranch}
        onDeleteBranch={vi.fn()}
        onMerge={vi.fn()}
      />
    );

    const checkoutBtn = screen.getByText('Checkout');
    fireEvent.click(checkoutBtn);

    expect(onSwitchBranch).toHaveBeenCalledWith('feature/agent-swarm');
  });
});
