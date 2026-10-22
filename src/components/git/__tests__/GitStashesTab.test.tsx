import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GitStashesTab } from '../GitStashesTab';
import { GitStash } from '../../../types/gitWorkflow';

describe('GitStashesTab Component', () => {
  const mockStashes: GitStash[] = [
    { index: 0, name: 'stash@{0}', message: 'WIP on feature/auth', branch: 'main', timestamp: '2026-10-22' },
  ];

  it('renders stashes list and triggers apply action', async () => {
    const onApplyStash = vi.fn();
    render(
      <GitStashesTab
        stashes={mockStashes}
        onSaveStash={vi.fn()}
        onApplyStash={onApplyStash}
        onDropStash={vi.fn()}
      />
    );

    expect(screen.getByText(/WIP on feature\/auth/i)).toBeDefined();
    const applyBtn = screen.getByText('Apply');
    fireEvent.click(applyBtn);
    expect(onApplyStash).toHaveBeenCalledWith(0, false);
  });
});
