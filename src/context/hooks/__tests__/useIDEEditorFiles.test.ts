import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIDEEditorFiles } from '../useIDEEditorFiles';
import { VirtualFileSystem } from '../../../services/virtualFs';

describe('useIDEEditorFiles', () => {
  let vfs: VirtualFileSystem;
  const mockSetCursorPosition = vi.fn();
  const mockSetActiveView = vi.fn();
  const mockLogAgentAction = vi.fn();
  const mockRefreshGit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vfs = new VirtualFileSystem([
      {
        id: '1',
        name: 'test.ts',
        path: 'src/test.ts',
        type: 'file',
        content: 'const x = 10;',
      },
    ]);
  });

  it('initializes with empty tabs and inactive file state', () => {
    const { result } = renderHook(() =>
      useIDEEditorFiles({
        vfs,
        activeProjectId: 'proj-1',
        setCursorPosition: mockSetCursorPosition,
        setActiveView: mockSetActiveView,
        logAgentAction: mockLogAgentAction,
        refreshGit: mockRefreshGit,
      })
    );

    expect(result.current.openTabs).toEqual([]);
    expect(result.current.activeTabId).toBeNull();
    expect(result.current.activeFile).toBeNull();
    expect(result.current.autoSave).toBe(true);
  });

  it('opens a file from virtual file system and updates active tab', async () => {
    const { result } = renderHook(() =>
      useIDEEditorFiles({
        vfs,
        activeProjectId: 'proj-1',
        setCursorPosition: mockSetCursorPosition,
        setActiveView: mockSetActiveView,
        logAgentAction: mockLogAgentAction,
        refreshGit: mockRefreshGit,
      })
    );

    await act(async () => {
      await result.current.openFileInEditor('src/test.ts');
    });

    expect(result.current.openTabs.length).toBe(1);
    expect(result.current.openTabs[0].filePath).toBe('src/test.ts');
    expect(result.current.activeFile).toBe('src/test.ts');
    expect(result.current.activeFileContent).toBe('const x = 10;');
  });

  it('closes a tab properly and cleans up active file', async () => {
    const { result } = renderHook(() =>
      useIDEEditorFiles({
        vfs,
        activeProjectId: 'proj-1',
        setCursorPosition: mockSetCursorPosition,
        setActiveView: mockSetActiveView,
        logAgentAction: mockLogAgentAction,
        refreshGit: mockRefreshGit,
      })
    );

    let tabId = '';
    await act(async () => {
      const tab = await result.current.openFileInEditor('src/test.ts');
      tabId = tab.id;
    });

    expect(result.current.openTabs.length).toBe(1);

    act(() => {
      result.current.closeTab(tabId);
    });

    expect(result.current.openTabs.length).toBe(0);
    expect(result.current.activeTabId).toBeNull();
    expect(result.current.activeFile).toBeNull();
  });
});
