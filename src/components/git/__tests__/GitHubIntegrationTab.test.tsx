import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitHubIntegrationTab } from '../GitHubIntegrationTab';
import { GitHubPullRequest, GitHubIssue } from '../../../types/gitWorkflow';

describe('GitHubIntegrationTab Component', () => {
  it('renders authentication prompt when not authenticated', () => {
    const onSaveToken = vi.fn();
    render(
      <GitHubIntegrationTab
        gitHubAuthed={false}
        gitHubUser={null}
        gitHubOwner=""
        gitHubRepo=""
        pullRequests={[]}
        issues={[]}
        onSaveToken={onSaveToken}
        onUpdateRepo={vi.fn()}
        onCreatePR={vi.fn()}
      />
    );

    expect(screen.getByText('GitHub Integration')).toBeDefined();
    expect(screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx')).toBeDefined();

    const input = screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx');
    fireEvent.change(input, { target: { value: 'ghp_secret_token_12345' } });

    const authBtn = screen.getByText('Authenticate with GitHub');
    fireEvent.click(authBtn);

    expect(onSaveToken).toHaveBeenCalledWith('ghp_secret_token_12345');
  });

  it('renders user details and pull requests when authenticated', () => {
    const mockPRs: GitHubPullRequest[] = [
      {
        number: 42,
        title: 'feat: add autonomous code verification engine',
        author: { login: 'principal-engineer' },
        state: 'open',
        htmlUrl: 'https://github.com/org/repo/pull/42',
        body: 'Pull request description',
        headBranch: 'feat/verification',
        baseBranch: 'main',
        labels: [],
        createdAt: '2026-10-22T00:00:00Z',
        updatedAt: '2026-10-22T01:00:00Z',
      },
    ];

    render(
      <GitHubIntegrationTab
        gitHubAuthed={true}
        gitHubUser={{ login: 'octocat', name: 'Mona Lisa Octocat' }}
        gitHubOwner="org"
        gitHubRepo="repo"
        pullRequests={mockPRs}
        issues={[]}
        onSaveToken={vi.fn()}
        onUpdateRepo={vi.fn()}
        onCreatePR={vi.fn()}
      />
    );

    expect(screen.getByText('Connected')).toBeDefined();
    expect(screen.getByText('octocat')).toBeDefined();
    expect(screen.getByText('#42 feat: add autonomous code verification engine')).toBeDefined();
  });
});
