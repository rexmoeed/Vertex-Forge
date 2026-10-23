import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BugDetectiveView } from '../BugDetectiveView';

vi.mock('../../../context/IDEContext', () => ({
  useIDE: () => ({
    bugDetective: {
      investigateBug: vi.fn().mockResolvedValue({
        id: 'bug-inv-1',
        title: 'Task counter NaN error',
        status: 'root_cause_identified',
        hypotheses: [
          { id: 'h1', description: 'Undefined state check in task counter', probability: 0.95, verificationMethod: 'AST analysis' }
        ],
        proposedFixes: [
          { id: 'f1', title: 'Add optional chaining', targetFile: 'src/tasks.ts', diff: '+ val?.count', confidence: 0.9 }
        ],
        reproductionSteps: ['Open task view', 'Trigger increment with zero tasks'],
      }),
    },
    openFile: vi.fn(),
    setActiveView: vi.fn(),
  }),
}));

describe('BugDetectiveView Component', () => {
  it('renders Bug Detective UI with inputs and investigation triggers', () => {
    render(<BugDetectiveView />);

    expect(screen.getByText('Bug Detective')).toBeDefined();
    expect(screen.getByText(/Cross-Layer Diagnostic Engine/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Launch Investigation/i })).toBeDefined();
  });

  it('allows editing bug description and changing environment', () => {
    render(<BugDetectiveView />);

    const textarea = screen.getAllByPlaceholderText(/Cannot read property 'map'/i)[0];
    fireEvent.change(textarea, { target: { value: 'Crash on clicking save file button' } });
    expect(textarea).toBeDefined();

    const envSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(envSelect, { target: { value: 'staging' } });
    expect(envSelect).toBeDefined();
  });

  it('navigates back to editor when back button clicked', () => {
    render(<BugDetectiveView />);

    const backBtn = screen.getAllByTitle('Return to Main Editor Workspace')[0];
    expect(backBtn).toBeDefined();
    fireEvent.click(backBtn);
  });
});
