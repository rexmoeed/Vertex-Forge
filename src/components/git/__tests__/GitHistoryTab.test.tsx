import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { GitHistoryTab } from '../GitHistoryTab';
import { GitCommitInfo } from '../../../types/gitWorkflow';

describe('GitHistoryTab Component', () => {
  afterEach(cleanup);
  const mockCommits: GitCommitInfo[] = [
    {
      hash: 'abc1234567890abcdef',
      shortHash: 'abc1234',
      message: 'feat: add user authentication workflow',
      author: 'Lead Developer <dev@example.com>',
      relativeTime: '2 hours ago',
      email: 'test@example.com', timestamp: '2026-10-22', isHead: false, parents: [],
    },
    {
      hash: 'def9876543210fedcba',
      shortHash: 'def9876',
      message: 'fix: resolve race condition in file lock',
      author: 'Security Architect <arch@example.com>',
      relativeTime: '4 hours ago',
      email: 'test@example.com', timestamp: '2026-10-22', isHead: false, parents: [],
    },
  ];

  it('renders commit list with short hash, message, and author', () => {
    const onRefresh = vi.fn();
    const onCherryPick = vi.fn();
    const onRevert = vi.fn();

    render(
      <GitHistoryTab
        commits={mockCommits}
        onRefresh={onRefresh}
        onCherryPick={onCherryPick}
        onRevert={onRevert}
      />
    );

    expect(screen.getByText('Recent Commits (2)')).toBeDefined();
    expect(screen.getByText('abc1234')).toBeDefined();
    expect(screen.getByText('feat: add user authentication workflow')).toBeDefined();
    expect(screen.getByText('def9876')).toBeDefined();
  });

  it('triggers onCherryPick and onRevert callbacks with commit hash', () => {
    const onRefresh = vi.fn();
    const onCherryPick = vi.fn();
    const onRevert = vi.fn();

    render(
      <GitHistoryTab
        commits={mockCommits}
        onRefresh={onRefresh}
        onCherryPick={onCherryPick}
        onRevert={onRevert}
      />
    );

    const cherryPickButtons = screen.getAllByText('Cherry-pick');
    fireEvent.click(cherryPickButtons[0]);
    expect(onCherryPick).toHaveBeenCalledWith('abc1234567890abcdef');

    const revertButtons = screen.getAllByText('Revert');
    fireEvent.click(revertButtons[1]);
    expect(onRevert).toHaveBeenCalledWith('def9876543210fedcba');
  });

  it('renders empty placeholder when no commits exist', () => {
    render(
      <GitHistoryTab
        commits={[]}
        onRefresh={vi.fn()}
        onCherryPick={vi.fn()}
        onRevert={vi.fn()}
      />
    );

    expect(screen.getByText('No commit history available.')).toBeDefined();
  });
});
