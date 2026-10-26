import { useEffect } from 'react';

export interface CursorPosition {
  line: number;
  column: number;
}

type CursorListener = (pos: CursorPosition) => void;
const listeners = new Set<CursorListener>();
let currentPos: CursorPosition = { line: 1, column: 1 };

export const EditorCursorTracker = {
  subscribe(listener: CursorListener) {
    listeners.add(listener);
    listener(currentPos);
    return () => listeners.delete(listener);
  },
  recordPosition(line: number, column: number) {
    currentPos = { line, column };
    listeners.forEach(l => l(currentPos));
  },
  getPosition(): CursorPosition {
    return currentPos;
  },
  reset() {
    this.recordPosition(1, 1);
  },
};

export function useEditorCursorTracking(
  filePath: string | undefined,
  onCursorChange?: (pos: CursorPosition) => void
) {
  useEffect(() => {
    if (!filePath) return;

    const unsubscribe = EditorCursorTracker.subscribe(pos => {
      if (onCursorChange) {
        onCursorChange(pos);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [filePath, onCursorChange]);
}
