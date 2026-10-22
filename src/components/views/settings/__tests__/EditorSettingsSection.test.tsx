import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorSettingsSection } from '../EditorSettingsSection';

describe('EditorSettingsSection Component', () => {
  const mockSetAutoSave = vi.fn();
  const mockSetAutoSaveDelay = vi.fn();
  const mockSaveAll = vi.fn();

  it('renders editor auto-save configuration and triggers save all', () => {
    render(
      <EditorSettingsSection
        autoSave={true}
        setAutoSave={mockSetAutoSave}
        autoSaveDelay={1000}
        setAutoSaveDelay={mockSetAutoSaveDelay}
        saveAllFiles={mockSaveAll}
      />
    );

    expect(screen.getByText('Editor & Auto-Save Configuration')).toBeDefined();
    expect(screen.getByText('Save All Files')).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: /Save All Files/i });
    fireEvent.click(saveBtn);
    expect(mockSaveAll).toHaveBeenCalled();
  });

  it('toggles auto-save state', () => {
    render(
      <EditorSettingsSection
        autoSave={true}
        setAutoSave={mockSetAutoSave}
        autoSaveDelay={1000}
        setAutoSaveDelay={mockSetAutoSaveDelay}
        saveAllFiles={mockSaveAll}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    expect(mockSetAutoSave).toHaveBeenCalledWith(false);
  });
});
