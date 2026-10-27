import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EditorEmptyState } from '../EditorEmptyState';
import { EditorDiffReviewBar } from '../EditorDiffReviewBar';
import { EditorInlineAIBar } from '../EditorInlineAIBar';
import { EditorGutter } from '../EditorGutter';
import { EditorMinimap } from '../EditorMinimap';

describe('Modular Editor Subcomponents', () => {
  it('renders EditorEmptyState with shortcuts and triggers focus', () => {
    const handleFocus = vi.fn();
    render(<EditorEmptyState onFocus={handleFocus} />);

    expect(screen.getByText('Vertex Forge Autonomous Studio')).toBeDefined();
    expect(screen.getByText('Quick Open')).toBeDefined();
    const container = screen.getByText('Vertex Forge Autonomous Studio').closest('div');
    if (container) fireEvent.click(container);
    expect(handleFocus).toHaveBeenCalled();
  });

  it('renders EditorDiffReviewBar with action buttons', () => {
    const handleToggle = vi.fn();
    const handleReject = vi.fn();
    const handleAccept = vi.fn();

    render(
      <EditorDiffReviewBar
        diffMode={false}
        onToggleDiffMode={handleToggle}
        onReject={handleReject}
        onAccept={handleAccept}
      />
    );

    expect(screen.getByText('Cursor Inline Diff Review')).toBeDefined();
    fireEvent.click(screen.getByText('Compare'));
    expect(handleToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Reject'));
    expect(handleReject).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Accept'));
    expect(handleAccept).toHaveBeenCalled();
  });

  it('renders EditorInlineAIBar and allows submitting prompt', () => {
    const setPrompt = vi.fn();
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <EditorInlineAIBar
        inlinePrompt="Add tests"
        setInlinePrompt={setPrompt}
        isInlineLoading={false}
        inlineResultNotice={null}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Antigravity Inline Assistant')).toBeDefined();
    const applyBtn = screen.getByText('Apply');
    fireEvent.click(applyBtn);
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('renders EditorGutter with line numbers and handles breakpoint click', () => {
    const handleToggleBreakpoint = vi.fn();
    const gutterRef = React.createRef<HTMLDivElement>();

    render(
      <EditorGutter
        lines={['line 1', 'line 2', 'line 3']}
        activeFile="src/index.ts"
        debugBreakpoints={[{ filePath: 'src/index.ts', line: 2, enabled: true }]}
        toggleBreakpoint={handleToggleBreakpoint}
        gutterRef={gutterRef}
      />
    );

    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    fireEvent.click(screen.getByText('2'));
    expect(handleToggleBreakpoint).toHaveBeenCalledWith('src/index.ts', 2);
  });

  it('renders EditorMinimap lines', () => {
    const textareaRef = React.createRef<HTMLTextAreaElement>();
    render(<EditorMinimap lines={['const x = 1;', 'export default x;']} textareaRef={textareaRef} />);
    expect(screen.getByTitle(/Code Minimap/)).toBeDefined();
  });
});
