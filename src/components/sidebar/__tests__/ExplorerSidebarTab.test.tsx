import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExplorerSidebarTab } from '../ExplorerSidebarTab';

const mockUseIDE = vi.fn();
const mockUseLayout = vi.fn();

vi.mock('../../../context/IDEContext', () => ({
  useIDE: () => mockUseIDE(),
}));

vi.mock('../../../context/LayoutContext', () => ({
  useLayout: () => mockUseLayout(),
}));

afterEach(cleanup);

describe('ExplorerSidebarTab Component', () => {
  const defaultLayout = {
    config: { primarySidebarPosition: 'left' },
    setPrimarySidebarPosition: vi.fn(),
    togglePrimarySidebar: vi.fn(),
  };

  it('renders No Folder Opened guide when workspace has no opened folder', () => {
    const openLocalFolder = vi.fn();
    mockUseLayout.mockReturnValue(defaultLayout);
    mockUseIDE.mockReturnValue({
      activeProject: null,
      fileTree: [],
      activeFile: null,
      activeFileContent: '',
      openFile: vi.fn(),
      createFileOrFolder: vi.fn(),
      deleteFileOrFolder: vi.fn(),
      modifiedFiles: [],
      vfs: { getCommits: () => [] },
      setIsProjectWizardOpen: vi.fn(),
      setIsCloneModalOpen: vi.fn(),
      openLocalFolder,
    });

    render(<ExplorerSidebarTab />);
    expect(screen.getByText('NO FOLDER OPENED')).toBeDefined();
    expect(screen.getByText('No Folder Opened')).toBeDefined();

    const openBtn = screen.getByRole('button', { name: /^Open Folder...$/ });
    expect(openBtn).toBeDefined();
    fireEvent.click(openBtn);
    expect(openLocalFolder).toHaveBeenCalled();
  });

  it('renders file tree and workspace name when active project is open', () => {
    mockUseLayout.mockReturnValue(defaultLayout);
    mockUseIDE.mockReturnValue({
      activeProject: { id: 'proj-1', name: 'My Fullstack App', rootFiles: ['src/App.tsx'] },
      fileTree: [
        { id: '1', name: 'src', path: 'src', type: 'directory', children: [
          { id: '2', name: 'App.tsx', path: 'src/App.tsx', type: 'file' }
        ]}
      ],
      activeFile: 'src/App.tsx',
      activeFileContent: 'export interface User { id: string; }',
      openFile: vi.fn(),
      createFileOrFolder: vi.fn(),
      deleteFileOrFolder: vi.fn(),
      modifiedFiles: [],
      vfs: { getCommits: () => [] },
      setIsProjectWizardOpen: vi.fn(),
      setIsCloneModalOpen: vi.fn(),
      openLocalFolder: vi.fn(),
    });

    render(<ExplorerSidebarTab />);
    expect(screen.getByText('MY FULLSTACK APP')).toBeDefined();
    expect(screen.getByText('src')).toBeDefined();
  });

  it('renders Outline and Timeline collapsible sections', () => {
    mockUseLayout.mockReturnValue(defaultLayout);
    mockUseIDE.mockReturnValue({
      activeProject: { id: 'proj-1', name: 'My Fullstack App', rootFiles: ['src/App.tsx'] },
      fileTree: [],
      activeFile: 'src/App.tsx',
      activeFileContent: 'export interface User { id: string; }',
      openFile: vi.fn(),
      createFileOrFolder: vi.fn(),
      deleteFileOrFolder: vi.fn(),
      modifiedFiles: [],
      vfs: { getCommits: () => [{ hash: '12345678', message: 'feat: add auth', timestamp: Date.now() }] },
      setIsProjectWizardOpen: vi.fn(),
      setIsCloneModalOpen: vi.fn(),
      openLocalFolder: vi.fn(),
    });

    render(<ExplorerSidebarTab />);
    expect(screen.getByText('Outline')).toBeDefined();
    expect(screen.getByText('Timeline')).toBeDefined();
  });
});
