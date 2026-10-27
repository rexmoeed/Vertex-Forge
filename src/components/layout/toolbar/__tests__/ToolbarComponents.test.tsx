import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ToolbarPanelToggles } from '../ToolbarPanelToggles';
import { ToolbarPresetsDropdown } from '../ToolbarPresetsDropdown';
import { LayoutProvider } from '../../../../context/LayoutContext';

describe('Toolbar Modular Subcomponents', () => {
  it('renders ToolbarPanelToggles with all workbench panel toggle buttons', () => {
    render(
      <LayoutProvider>
        <ToolbarPanelToggles />
      </LayoutProvider>
    );

    expect(screen.getByTitle(/Toggle Primary Sidebar/i)).toBeDefined();
    expect(screen.getByTitle(/Toggle Bottom Terminal Dock/i)).toBeDefined();
    expect(screen.getByTitle(/Toggle AI Assistant Panel/i)).toBeDefined();
    expect(screen.getByTitle(/Toggle Live Sandbox Preview/i)).toBeDefined();
  });

  it('renders ToolbarPresetsDropdown and opens preset list when clicked', () => {
    render(
      <LayoutProvider>
        <ToolbarPresetsDropdown />
      </LayoutProvider>
    );

    const presetBtn = screen.getByTitle(/Select Workspace Layout Preset/i);
    expect(presetBtn).toBeDefined();

    fireEvent.click(presetBtn);
    expect(screen.getByText(/Layout Presets/i)).toBeDefined();
    expect(screen.getByText(/Minimal/i)).toBeDefined();
    expect(screen.getByText(/Zen Mode/i)).toBeDefined();
  });
});
