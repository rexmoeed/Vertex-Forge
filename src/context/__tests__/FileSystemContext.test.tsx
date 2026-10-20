import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FileSystemProvider, useFileSystem } from '../FileSystemContext';
import { VirtualFileSystem } from '../../services/virtualFs';

let latestVfs: VirtualFileSystem | null = null;

const ConsumerComponent: React.FC = () => {
  const {
    vfs,
    openTabs,
    activeFile,
    activeFileContent,
    createFileOrFolder,
    updateFileContent,
    saveCurrentFile,
    closeTab,
  } = useFileSystem();

  latestVfs = vfs;

  return (
    <div>
      <div data-testid="active-file">{activeFile || 'none'}</div>
      <div data-testid="active-content">{activeFileContent}</div>
      <div data-testid="tab-count">{openTabs.length}</div>
      <button
        onClick={() => createFileOrFolder('src/test.ts', 'file', 'export const x = 1;')}
      >
        Create File
      </button>
      <button onClick={() => updateFileContent('export const x = 2;')}>Update Content</button>
      <button onClick={() => saveCurrentFile()}>Save</button>
      <button onClick={() => openTabs[0] && closeTab(openTabs[0].id)}>Close Tab</button>
    </div>
  );
};

describe('FileSystemContext Layer', () => {
  it('manages file creation, opening tabs, and content mutations', async () => {
    const vfs = new VirtualFileSystem([]);

    render(
      <FileSystemProvider initialVfs={vfs}>
        <ConsumerComponent />
      </FileSystemProvider>
    );

    expect(screen.getByTestId('active-file').textContent).toBe('none');
    expect(screen.getByTestId('tab-count').textContent).toBe('0');

    // Create file
    await act(async () => {
      screen.getByText('Create File').click();
    });

    expect(screen.getByTestId('active-file').textContent).toBe('src/test.ts');
    expect(screen.getByTestId('active-content').textContent).toBe('export const x = 1;');
    expect(screen.getByTestId('tab-count').textContent).toBe('1');

    // Update content
    act(() => {
      screen.getByText('Update Content').click();
    });
    expect(screen.getByTestId('active-content').textContent).toBe('export const x = 2;');

    // Save
    await act(async () => {
      screen.getByText('Save').click();
    });
    expect(latestVfs?.readFile('src/test.ts')).toBe('export const x = 2;');

    // Close tab
    act(() => {
      screen.getByText('Close Tab').click();
    });
    expect(screen.getByTestId('tab-count').textContent).toBe('0');
    expect(screen.getByTestId('active-file').textContent).toBe('none');
  });
});
