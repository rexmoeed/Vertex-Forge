import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EditorCursorTracker } from '../EditorCursorTracking';
import { useEditorFindReplaceController } from '../EditorFindReplaceController';

describe('EditorArea Modular Controllers', () => {
  it('tracks cursor positions across file edits', () => {
    let recordedPos = { line: 0, column: 0 };
    const unsubscribe = EditorCursorTracker.subscribe(pos => {
      recordedPos = pos;
    });

    EditorCursorTracker.recordPosition(42, 18);
    expect(recordedPos.line).toBe(42);
    expect(recordedPos.column).toBe(18);

    EditorCursorTracker.reset();
    expect(recordedPos.line).toBe(1);
    expect(recordedPos.column).toBe(1);

    unsubscribe();
  });

  it('controls find and replace overlay state', () => {
    const { result } = renderHook(() => useEditorFindReplaceController());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openFind('targetToken');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.findText).toBe('targetToken');

    act(() => {
      result.current.toggleMatchCase();
      result.current.setReplaceText('replacementToken');
      result.current.setMatches(5, 2);
    });

    expect(result.current.matchCase).toBe(true);
    expect(result.current.replaceText).toBe('replacementToken');
    expect(result.current.matchesCount).toBe(5);
    expect(result.current.currentMatchIndex).toBe(2);

    act(() => {
      result.current.closeFind();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
