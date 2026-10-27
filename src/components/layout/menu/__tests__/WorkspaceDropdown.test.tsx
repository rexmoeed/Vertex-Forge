import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WorkspaceDropdown } from '../WorkspaceDropdown';
import { TopMenuBarRightControls } from '../TopMenuBarRightControls';
import { LayoutProvider } from '../../../../context/LayoutContext';
import { ThemeProvider } from '../../../../context/ThemeContext';

describe('TopMenuBar Subcomponents', () => {
  it('renders WorkspaceDropdown and allows switching projects', () => {
    const onSwitchProject = vi.fn();
    const onClose = vi.fn();

    const projects = [
      { id: 'proj-1', name: 'Alpha' },
      { id: 'proj-2', name: 'Beta' },
    ];

    render(
      <WorkspaceDropdown
        isOpen={true}
        projects={projects}
        activeProjectId="proj-1"
        onSwitchProject={onSwitchProject}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();

    fireEvent.mouseDown(screen.getByText('Beta'));
    expect(onSwitchProject).toHaveBeenCalledWith('proj-2');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders TopMenuBarRightControls with model pill and buttons', () => {
    const onSetActiveView = vi.fn();
    const onOpenJulesMission = vi.fn();

    render(
      <ThemeProvider>
        <LayoutProvider>
          <TopMenuBarRightControls
            activeProjectName="Vertex Forge Main"
            onOpenJulesMission={onOpenJulesMission}
            onSetActiveView={onSetActiveView}
          />
        </LayoutProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('Vertex Forge Main')).toBeDefined();
    expect(screen.getByText('Gemini 3.8 Flash')).toBeDefined();
    expect(screen.getByText('Jules Cloud')).toBeDefined();

    fireEvent.click(screen.getByText('Jules Cloud'));
    expect(onOpenJulesMission).toHaveBeenCalled();
  });
});
