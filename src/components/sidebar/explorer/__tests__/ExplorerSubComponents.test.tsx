import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ExplorerContextMenu } from '../ExplorerContextMenu';
import { NoFolderOpenedView } from '../NoFolderOpenedView';
import { OutlineTimelineSection } from '../OutlineTimelineSection';

describe('Explorer Sidebar Sub-Components', () => {
  it('renders ExplorerContextMenu and triggers actions', () => {
    const onNewFile = vi.fn();
    const onNewFolder = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();

    const node: any = { id: '1', name: 'Button.tsx', path: 'src/Button.tsx', type: 'file' };

    render(
      <ExplorerContextMenu
        contextMenu={{ x: 100, y: 100, node }}
        onClose={onClose}
        onNewFile={onNewFile}
        onNewFolder={onNewFolder}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Button.tsx')).toBeDefined();
    fireEvent.click(screen.getByText('New File'));
    expect(onNewFile).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders NoFolderOpenedView and handles buttons', () => {
    const onOpenLocalFolder = vi.fn();
    const onOpenProjectWizard = vi.fn();
    const onOpenCloneModal = vi.fn();

    render(
      <NoFolderOpenedView
        onOpenLocalFolder={onOpenLocalFolder}
        onOpenProjectWizard={onOpenProjectWizard}
        onOpenCloneModal={onOpenCloneModal}
      />
    );

    expect(screen.getByText('No Folder Opened')).toBeDefined();
    fireEvent.click(screen.getByText('Open Folder...'));
    expect(onOpenLocalFolder).toHaveBeenCalled();

    fireEvent.click(screen.getByText('New Project with AI'));
    expect(onOpenProjectWizard).toHaveBeenCalled();
  });

  it('renders OutlineTimelineSection and parses symbols', () => {
    const onOpenFile = vi.fn();
    const content = `
export interface UserProfile {
  id: string;
}
export function renderProfile() {
  return null;
}
`;

    render(
      <OutlineTimelineSection
        activeFile="src/profile.ts"
        activeFileContent={content}
        onOpenFile={onOpenFile}
      />
    );

    expect(screen.getByText('Outline')).toBeDefined();
    expect(screen.getByText('2 Symbols')).toBeDefined();
  });
});
