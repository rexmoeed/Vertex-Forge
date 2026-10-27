import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorInlineAI } from '../useEditorInlineAI';

describe('useEditorInlineAI', () => {
  it('manages prompt and inline AI open state', () => {
    const updateFileContent = vi.fn();
    const saveCurrentFile = vi.fn();

    const { result } = renderHook(() =>
      useEditorInlineAI({
        activeFile: 'src/App.tsx',
        activeFileContent: 'console.log("hello");',
        updateFileContent,
        saveCurrentFile,
      })
    );

    expect(result.current.isInlineAIOpen).toBe(false);
    act(() => {
      result.current.setIsInlineAIOpen(true);
      result.current.setInlinePrompt('Add test log');
    });

    expect(result.current.isInlineAIOpen).toBe(true);
    expect(result.current.inlinePrompt).toBe('Add test log');
  });

  it('handles diff acceptance correctly', () => {
    const updateFileContent = vi.fn();
    const saveCurrentFile = vi.fn();

    const { result } = renderHook(() =>
      useEditorInlineAI({
        activeFile: 'src/App.tsx',
        activeFileContent: 'console.log("hello");',
        updateFileContent,
        saveCurrentFile,
      })
    );

    act(() => {
      result.current.handleAcceptInlineDiff();
    });

    expect(result.current.isDiffReviewActive).toBe(false);
    expect(saveCurrentFile).toHaveBeenCalledTimes(1);
  });
});
