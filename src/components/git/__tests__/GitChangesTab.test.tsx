import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GitChangesTab } from '../GitChangesTab';
import { GitWorkingTreeStatus } from '../../../types/gitWorkflow';

describe('GitChangesTab Component', () => {
  afterEach(cleanup);

  const mockStatus: GitWorkingTreeStatus = {
    branch: 'main',
    isRepo: true,
    ahead: 0,
    behind: 0,
    isDetached: false,
    staged: [{ filePath: 'src/App.tsx', status: 'modified', staged: true }],
    unstaged: [{ filePath: 'src/index.css', status: 'modified', staged: false }],
    untracked: [{ filePath: 'src/NewComponent.tsx', status: 'untracked', staged: false }],
    conflicted: [],
    hasConflicts: false,
  };

  it('renders commit textarea and handles input change', () => {
    const setCommitMessage = vi.fn();
    render(
      <GitChangesTab
        status={mockStatus}
        commitMessage="feat: test commit"
        setCommitMessage={setCommitMessage}
        amend={false}
        setAmend={vi.fn()}
        aiLoading={false}
        aiReviewResult={null}
        setAiReviewResult={vi.fn()}
        isCommitting={false}
        onSuggestCommitMessage={vi.fn()}
        onReviewWithAI={vi.fn()}
        onCommit={vi.fn()}
        onOpenFile={vi.fn()}
        onStage={vi.fn()}
        onStageAll={vi.fn()}
        onUnstage={vi.fn()}
        onUnstageAll={vi.fn()}
        onDiscard={vi.fn()}
        onDiscardAll={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/Commit message/i);
    expect(textarea).toBeDefined();
    fireEvent.change(textarea, { target: { value: 'fix: resolve bug' } });
    expect(setCommitMessage).toHaveBeenCalledWith('fix: resolve bug');
  });

  it('triggers onCommit when commit button is clicked', () => {
    const onCommit = vi.fn();
    render(
      <GitChangesTab
        status={mockStatus}
        commitMessage="feat: test commit"
        setCommitMessage={vi.fn()}
        amend={false}
        setAmend={vi.fn()}
        aiLoading={false}
        aiReviewResult={null}
        setAiReviewResult={vi.fn()}
        isCommitting={false}
        onSuggestCommitMessage={vi.fn()}
        onReviewWithAI={vi.fn()}
        onCommit={onCommit}
        onOpenFile={vi.fn()}
        onStage={vi.fn()}
        onStageAll={vi.fn()}
        onUnstage={vi.fn()}
        onUnstageAll={vi.fn()}
        onDiscard={vi.fn()}
        onDiscardAll={vi.fn()}
      />
    );

    const commitBtn = screen.getByRole('button', { name: /Commit \(1\)/i });
    fireEvent.click(commitBtn);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
