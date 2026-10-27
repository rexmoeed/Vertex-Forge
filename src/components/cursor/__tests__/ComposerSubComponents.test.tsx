import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComposerFilesSidebar } from '../ComposerFilesSidebar';
import { ComposerDiffPreview } from '../ComposerDiffPreview';

describe('Cursor Composer Subcomponents', () => {
  it('renders ComposerFilesSidebar and handles file selection', () => {
    const onSelectFileIndex = vi.fn();
    const onToggleAcceptFile = vi.fn();

    const mockResult = {
      message: 'Done',
      model: 'gemini-3.8-flash',
      summary: 'Test summary',
      explanation: 'Test explanation',
      changes: [
        {
          id: 'c1',
          filePath: 'src/test.ts',
          action: 'create' as const,
          explanation: 'New file',
          originalContent: '',
          newContent: 'export const a = 1;',
          additions: 1,
          deletions: 0,
          accepted: true,
          riskLevel: 'low' as const,
        },
      ],
    };

    render(
      <ComposerFilesSidebar
        generationResult={mockResult}
        selectedFileIndex={0}
        onSelectFileIndex={onSelectFileIndex}
        onToggleAcceptFile={onToggleAcceptFile}
      />
    );

    expect(screen.getByText('src/test.ts')).toBeDefined();
    expect(screen.getByText('1 accepted')).toBeDefined();
  });

  it('renders ComposerDiffPreview with code lines', () => {
    const onToggleAcceptFile = vi.fn();
    const mockChange = {
      id: 'c1',
      filePath: 'src/test.ts',
      action: 'create' as const,
      explanation: 'New file',
      originalContent: '',
      newContent: 'const greeting = "hello";',
      additions: 1,
      deletions: 0,
      accepted: true,
      riskLevel: 'low' as const,
    };

    render(
      <ComposerDiffPreview
        currentChange={mockChange}
        selectedFileIndex={0}
        onToggleAcceptFile={onToggleAcceptFile}
      />
    );

    expect(screen.getAllByText('src/test.ts').length).toBeGreaterThan(0);
    expect(screen.getByText(/greeting/)).toBeDefined();
  });
});
