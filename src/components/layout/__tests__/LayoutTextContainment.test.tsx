import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentDecompositionToolbar } from '../../views/agent/AgentDecompositionToolbar';
import { AgentQATab } from '../../views/agent/AgentQATab';
import { OperatorApprovalsTab } from '../../views/operator/OperatorApprovalsTab';
import { OperatorVaultTab } from '../../views/operator/OperatorVaultTab';
import { OperatorCouncilTab } from '../../views/operator/OperatorCouncilTab';
import type { ApprovalQueueItem, CouncilSession } from '../../../types/kos';

describe('Layout Text Containment & Boundary Enforcements', () => {
  it('AgentDecompositionToolbar renders with responsive break-words and min-w-0 classes', () => {
    const { container } = render(
      <AgentDecompositionToolbar
        projectGoalInput=""
        setProjectGoalInput={vi.fn()}
        isParallelRunning={false}
        activeParallelSubAgents={[]}
        parallelConcurrency={3}
        setParallelConcurrency={vi.fn()}
        onRunParallel={vi.fn()}
        onDecomposeProject={vi.fn()}
        onCancelParallel={vi.fn()}
        onResetTasks={vi.fn()}
        tasks={[]}
        activeProjectName="UltraLongProjectDirectoryNameToEnsureContainmentDoesNotBlowOutContainers"
      />
    );

    const title = screen.getByText(/Dynamic Project Decomposition/i);
    expect(title.className).toContain('break-words');

    const input = container.querySelector('input');
    expect(input?.className).toContain('min-w-0');
    expect(input?.className).toContain('flex-1');

    const workspaceBadge = screen.getByText(/Workspace:/i);
    expect(workspaceBadge.className).toContain('truncate');
  });

  it('AgentQATab renders error diagnostics with break-all and overflow containment', () => {
    const { container } = render(
      <AgentQATab
        testResults={[
          {
            id: '1',
            testName: 'VeryLongTestAssertionName_ShouldSafelyWrapWithinBoundariesWithoutBlowingOutTheLayoutCard',
            filePath: 'src/services/very/deeply/nested/directory/path/to/test/runner/module/service.spec.ts',
            status: 'failed',
            errorStack: 'AssertionError: expected true to equal false\n  at runTest (src/services/deeply/nested/path/runner.ts:120:15)',
          },
        ]}
        failedTests={1}
        runTests={vi.fn()}
        triggerSelfHealDebug={vi.fn()}
      />
    );

    const failureBanner = screen.getByText(/Failure Diagnosis:/i);
    expect(failureBanner.parentElement?.className).toContain('min-w-0');

    const monoContainer = container.querySelector('.overflow-x-auto');
    expect(monoContainer?.className).toContain('overflow-x-auto');
    expect(monoContainer?.className).toContain('min-w-0');
  });

  it('OperatorApprovalsTab enforces max-w and break-words for long pending requests', () => {
    const approvals: ApprovalQueueItem[] = [
      {
        id: 'appr-1',
        title: 'Emergency Hotfix for Arbitrary Code Execution via SQL Injection Vulnerability in User Authentication Pipeline',
        category: 'tool_execution',
        risk: 'critical',
        status: 'pending',
        requester: 'Security Lead',
        description: 'A deeply detailed explanation of a critical patch modifying multi-region database connections and JWT session handlers across microservices.',
        createdAt: Date.now(),
      },
    ];

    render(
      <OperatorApprovalsTab
        approvals={approvals}
        onResolveApproval={vi.fn()}
      />
    );

    const titleEl = screen.getByText(/Emergency Hotfix/i);
    expect(titleEl.className).toContain('truncate');

    const descEl = screen.getByText(/A deeply detailed explanation/i);
    expect(descEl.className).toContain('break-words');
  });

  it('OperatorVaultTab renders responsive form inputs with min-w-0 containment', () => {
    const { container } = render(
      <OperatorVaultTab
        secrets={[]}
        newSecretName=""
        setNewSecretName={vi.fn()}
        newSecretVal=""
        setNewSecretVal={vi.fn()}
        newSecretType="api_key"
        setNewSecretType={vi.fn()}
        onAddSecret={vi.fn()}
        onDeleteSecret={vi.fn()}
      />
    );

    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      expect(input.className).toContain('min-w-0');
    });
  });

  it('OperatorCouncilTab renders deliberation summary with break-words and whitespace preservation', () => {
    const sessions: CouncilSession[] = [
      {
        id: 'sess-1',
        topic: 'Should we replace REST polling with WebSockets for real-time parallel sub-agent synchronization across local workers?',
        mode: 'vote',
        members: [],
        finalVerdict: 'approved',
        consensusSummary: 'Consensus achieved across Claude 3.7 Sonnet, GPT-4o, and Gemini 2.5 Pro with 0 dissenting opinions.',
        dissentingOpinions: [],
        votes: [
          {
            memberModel: 'Gemini 2.5 Pro',
            decision: 'approve',
            confidence: 0.95,
            reasoning: 'Reduces unnecessary HTTP roundtrip overhead by 85% while preserving event ordering guarantees.',
            latencyMs: 140,
            estimatedCostUsd: 0.002,
          },
        ],
        timestamp: Date.now(),
      },
    ];

    render(
      <OperatorCouncilTab
        councilSessions={sessions}
        councilTopic=""
        setCouncilTopic={vi.fn()}
        isConveningCouncil={false}
        onConveneCouncil={vi.fn()}
      />
    );

    const topicEl = screen.getByText(/Should we replace REST polling/i);
    expect(topicEl.className).toContain('truncate');

    const summaryEl = screen.getByText(/Consensus achieved/i);
    expect(summaryEl.className).toContain('break-words');
    expect(summaryEl.className).toContain('whitespace-pre-wrap');
  });
});
