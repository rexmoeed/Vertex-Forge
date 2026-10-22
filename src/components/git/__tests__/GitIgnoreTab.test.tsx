import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GitIgnoreTab } from '../GitIgnoreTab';

describe('GitIgnoreTab Component', () => {
  it('triggers onAddPreset with preset type when clicked', () => {
    const onAddPreset = vi.fn();
    render(<GitIgnoreTab onAddPreset={onAddPreset} />);

    const nodeBtn = screen.getByText('Node & npm');
    fireEvent.click(nodeBtn);
    expect(onAddPreset).toHaveBeenCalledWith('node');
  });
});
