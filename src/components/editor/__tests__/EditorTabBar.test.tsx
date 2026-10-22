import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EditorTabBar, OpenTab } from '../EditorTabBar';

afterEach(cleanup);

describe('EditorTabBar Component', () => {
  const mockTabs: OpenTab[] = [
    { id: 'tab-1', filePath: 'src/App.tsx', title: 'App.tsx' },
    { id: 'tab-2', filePath: 'src/server.ts', title: 'server.ts', isDirty: true },
  ];

  const defaultProps = {
    openTabs: mockTabs,
    activeTabId: 'tab-1',
    openFile: vi.fn(),
    closeTab: vi.fn(),
    setTabContextMenu: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    getFileIcon: () => <span data-testid="file-icon" />,
    isInlineAIOpen: false,
    setIsInlineAIOpen: vi.fn(),
    isCursorTabEnabled: true,
    setIsCursorTabEnabled: vi.fn(),
    onSplitRight: vi.fn(),
    onSplitDown: vi.fn(),
    canCloseSplit: false,
    onCloseSplit: vi.fn(),
    activeFile: 'src/App.tsx',
    diffMode: false,
    setDiffMode: vi.fn(),
    currentDiff: null,
    autoSave: true,
    isAutoSaving: false,
    activeTab: mockTabs[0],
    saveCurrentFile: vi.fn(),
    handleCopyCode: vi.fn(),
    copied: false,
    isFindOpen: false,
    setIsFindOpen: vi.fn(),
  };

  it('renders all open tabs with titles', () => {
    render(<EditorTabBar {...defaultProps} />);
    expect(screen.getByText('App.tsx')).toBeDefined();
    expect(screen.getByText('server.ts')).toBeDefined();
  });

  it('calls openFile when a tab is clicked', () => {
    const openFile = vi.fn();
    render(<EditorTabBar {...defaultProps} openFile={openFile} />);
    const serverTab = screen.getByText('server.ts');
    fireEvent.click(serverTab);
    expect(openFile).toHaveBeenCalledWith('src/server.ts');
  });

  it('calls closeTab when tab close button is clicked', () => {
    const closeTab = vi.fn();
    render(<EditorTabBar {...defaultProps} closeTab={closeTab} />);
    const closeButtons = screen.getAllByTitle(/Close Tab/i);
    expect(closeButtons.length).toBe(2);
    fireEvent.click(closeButtons[0]);
    expect(closeTab).toHaveBeenCalledWith('tab-1');
  });

  it('renders dirty unsaved indicator for modified tab', () => {
    render(<EditorTabBar {...defaultProps} />);
    expect(screen.getByTitle('Unsaved changes')).toBeDefined();
  });

  it('toggles find dialog when search action icon is clicked', () => {
    const setIsFindOpen = vi.fn();
    render(<EditorTabBar {...defaultProps} setIsFindOpen={setIsFindOpen} isFindOpen={false} />);
    const findBtn = screen.getByTitle(/Find & Replace in File/i);
    fireEvent.click(findBtn);
    expect(setIsFindOpen).toHaveBeenCalledWith(true);
  });
});
