import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SplitterProps {
  direction: 'vertical' | 'horizontal';
  onResize: (delta: number) => void;
  onDoubleClick?: () => void;
  label?: string;
  className?: string;
}

export const Splitter: React.FC<SplitterProps> = React.memo(({
  direction,
  onResize,
  onDoubleClick,
  label = 'Resize panel',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<number>(0);

  const isVertical = direction === 'vertical';

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = isVertical ? e.clientX : e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const current = isVertical ? e.clientX : e.clientY;
    const delta = current - startPosRef.current;
    if (delta !== 0) {
      onResize(delta);
      startPosRef.current = current;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // Keyboard accessibility: Arrow keys adjust size
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 30 : 10;
    if (isVertical) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onResize(-step);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onResize(step);
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onResize(-step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onResize(step);
      }
    }
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={direction}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      style={
        isDragging
          ? { backgroundColor: 'var(--ide-accent, #00ff88)' }
          : undefined
      }
      className={`group relative z-30 select-none transition-colors outline-none shrink-0 ${
        isVertical
          ? 'w-1 cursor-col-resize hover:w-1 h-full self-stretch'
          : 'h-1 cursor-row-resize hover:h-1 w-full'
      } ${
        isDragging
          ? 'shadow-[0_0_8px_var(--ide-accent,#00ff88)]'
          : 'bg-transparent hover:bg-[var(--ide-accent,#00ff88)]/40'
      } ${className}`}
      title={`${label} (Drag to resize, double-click to reset)`}
    >
      {/* Visual Grip Indicator on Hover / Drag */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <div
          style={{ backgroundColor: 'var(--ide-accent, #00ff88)' }}
          className={`rounded-full shadow-[0_0_6px_var(--ide-accent,#00ff88)] ${
            isVertical ? 'w-0.5 h-7' : 'h-0.5 w-7'
          }`}
        />
      </div>
    </div>
  );
});
