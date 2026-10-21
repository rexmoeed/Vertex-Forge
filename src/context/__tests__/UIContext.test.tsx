import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { UIProvider, useUI } from '../UIContext';

describe('UIContext & UIProvider', () => {
  it('throws an error if useUI is used outside of UIProvider', () => {
    expect(() => renderHook(() => useUI())).toThrow('useUI must be used within a UIProvider');
  });

  it('initializes with default views and tabs', () => {
    const { result } = renderHook(() => useUI(), {
      wrapper: ({ children }) => <UIProvider>{children}</UIProvider>,
    });

    expect(result.current.activeView).toBe('editor');
    expect(result.current.activeSidebarTab).toBe('explorer');
    expect(result.current.bottomPanelTab).toBe('terminal');
    expect(result.current.isBottomPanelOpen).toBe(true);
    expect(result.current.showPreview).toBe(false);
  });

  it('switches views and toggles bottom panel', () => {
    const { result } = renderHook(() => useUI(), {
      wrapper: ({ children }) => <UIProvider>{children}</UIProvider>,
    });

    act(() => {
      result.current.setActiveView('agents');
      result.current.toggleBottomPanel();
    });

    expect(result.current.activeView).toBe('agents');
    expect(result.current.isBottomPanelOpen).toBe(false);
  });

  it('updates modal open states', () => {
    const { result } = renderHook(() => useUI(), {
      wrapper: ({ children }) => <UIProvider>{children}</UIProvider>,
    });

    act(() => {
      result.current.setIsProjectWizardOpen(true);
      result.current.setIsCloseModalOpen(true);
    });

    expect(result.current.isProjectWizardOpen).toBe(true);
    expect(result.current.isCloseModalOpen).toBe(true);
  });
});
