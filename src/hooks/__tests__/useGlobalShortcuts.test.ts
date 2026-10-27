import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalShortcuts } from '../useGlobalShortcuts';

describe('useGlobalShortcuts', () => {
  it('registers keyboard event listener on mount and triggers actions', () => {
    const layout = {
      togglePrimarySidebar: vi.fn(),
      toggleSecondarySidebar: vi.fn(),
      toggleBottomPanel: vi.fn(),
      togglePreview: vi.fn(),
      toggleZenMode: vi.fn(),
      splitEditor: vi.fn(),
      config: {},
    };
    const setIsCommandPaletteOpen = vi.fn();
    const setIsComposerOpen = vi.fn();
    const setIsVoiceModalOpen = vi.fn();
    const setIsShortcutsOpen = vi.fn();
    const runTests = vi.fn();
    const saveCurrentFile = vi.fn();
    const setActiveView = vi.fn();
    const setActiveSidebarTab = vi.fn();

    renderHook(() =>
      useGlobalShortcuts({
        layout,
        setIsCommandPaletteOpen,
        setIsComposerOpen,
        setIsVoiceModalOpen,
        setIsShortcutsOpen,
        runTests,
        saveCurrentFile,
        setActiveView,
        setActiveSidebarTab,
        debugSession: null,
        debugThread: null,
        debuggerEngine: null,
      })
    );

    // Trigger Cmd+B
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true }));
    expect(layout.togglePrimarySidebar).toHaveBeenCalledTimes(1);

    // Trigger Cmd+T
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', metaKey: true }));
    expect(runTests).toHaveBeenCalledTimes(1);

    // Trigger Cmd+S
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));
    expect(saveCurrentFile).toHaveBeenCalledTimes(1);
  });
});
