import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GitTagsTab } from '../GitTagsTab';
import { GitTag } from '../../../types/gitWorkflow';

describe('GitTagsTab Component', () => {
  const mockTags: GitTag[] = [
    { name: 'v1.2.0', commitHash: 'abc1234' },
  ];

  it('renders tags list and handles creating a new tag', async () => {
    const onCreateTag = vi.fn();
    render(
      <GitTagsTab
        tags={mockTags}
        onCreateTag={onCreateTag}
        onDeleteTag={vi.fn()}
      />
    );

    expect(screen.getByText('v1.2.0')).toBeDefined();
    const input = screen.getByPlaceholderText('v1.0.0...');
    fireEvent.change(input, { target: { value: 'v1.3.0' } });
    const createBtn = screen.getByRole('button', { name: /^\s*Tag\s*$/i });
    fireEvent.click(createBtn);
    expect(onCreateTag).toHaveBeenCalledWith('v1.3.0');
  });
});
