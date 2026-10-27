import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderShortcutsBar } from '../FolderShortcutsBar';
import { FolderDirectoryList } from '../FolderDirectoryList';

describe('OpenFolderModal Subcomponents', () => {
  it('renders FolderShortcutsBar and triggers selection', () => {
    const onSelectPath = vi.fn();
    const mockData = {
      currentPath: '/home/user',
      parentPath: '/home',
      isRoot: false,
      breadcrumbs: [{ name: 'user', path: '/home/user' }],
      folders: [],
      drives: ['C:\\', 'D:\\'],
      shortcuts: [
        { name: 'Desktop', path: '/home/user/Desktop' },
        { name: 'Home', path: '/home/user' },
      ],
    };

    render(
      <FolderShortcutsBar
        data={mockData}
        currentPath="/home/user"
        onSelectPath={onSelectPath}
      />
    );

    const desktopBtn = screen.getByText('Desktop');
    fireEvent.click(desktopBtn);
    expect(onSelectPath).toHaveBeenCalledWith('/home/user/Desktop');

    const driveBtn = screen.getByText('C:\\');
    fireEvent.click(driveBtn);
    expect(onSelectPath).toHaveBeenCalledWith('C:\\');
  });

  it('renders FolderDirectoryList with items and handles enter', () => {
    const onSelectFolder = vi.fn();
    const onEnterFolder = vi.fn();
    const listRef = { current: null };

    render(
      <FolderDirectoryList
        listRef={listRef}
        error={null}
        loading={false}
        searchQuery=""
        filteredFolders={[
          { name: 'src', path: '/app/src', hasSubfolders: true },
        ]}
        selectedFolderInList={null}
        onSelectFolder={onSelectFolder}
        onEnterFolder={onEnterFolder}
      />
    );

    expect(screen.getByText('src')).toBeDefined();
    const enterBtn = screen.getByText('Enter →');
    fireEvent.click(enterBtn);
    expect(onEnterFolder).toHaveBeenCalledWith('/app/src');
  });
});
