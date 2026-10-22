import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { AgentContractsTab } from '../AgentContractsTab';
import { SubAgentTaskContract, CompletionReport } from '../../../../types/agentHierarchy';

afterEach(cleanup);

describe('AgentContractsTab Component', () => {
  const mockTasks: SubAgentTaskContract[] = [
    {
      taskId: 'task-1',
      parentAgentId: 'BackendLead',
      subAgentRole: 'AuthenticationSpecialist',
      title: 'OAuth Refresh Token Task',
      objective: 'Implement OAuth token refresh endpoint',
      instructions: 'Add token rotation logic in auth service',
      allowedTools: ['writeFile'],
      workspaceScope: 'src/services',
      allowedFilePaths: ['src/services/auth.ts'],
      restrictedFilePaths: [],
      dependencies: [],
      expectedDeliverables: ['auth.ts'],
      acceptanceCriteria: ['tests pass'],
      permissionLevel: 'write',
      status: 'completed',
      progressPercent: 100,
    },
    {
      taskId: 'task-2',
      parentAgentId: 'FrontendLead',
      subAgentRole: 'ReactComponentBuilder',
      title: 'OAuth Client Integration Task',
      objective: 'Integrate OAuth token in API client',
      instructions: 'Wire token into apiClient requests',
      allowedTools: ['writeFile'],
      workspaceScope: 'src/api',
      allowedFilePaths: ['src/api/client.ts'],
      restrictedFilePaths: [],
      dependencies: ['task-1'],
      expectedDeliverables: ['client.ts'],
      acceptanceCriteria: ['api handles refresh'],
      permissionLevel: 'write',
      status: 'working',
      progressPercent: 50,
    },
  ];

  const mockReports: CompletionReport[] = [
    {
      taskId: 'task-1',
      subAgentRole: 'AuthenticationSpecialist',
      workCompleted: 'Implemented JWT refresh rotation with unit tests',
      filesInspected: ['src/services/auth.ts'],
      filesModified: ['src/services/auth.ts'],
      toolsUsed: ['writeFile', 'runTest'],
      testsRun: ['auth.test.ts'],
      testResults: 'passed',
      knownLimitations: [],
      approvedByLead: true,
      timestamp: '10:15:00',
    },
  ];

  it('renders task delegation contracts with roles and objectives', () => {
    render(<AgentContractsTab tasks={mockTasks} reports={mockReports} />);
    expect(screen.getByTestId('agent-contracts-tab')).toBeDefined();
    expect(screen.getByText(/Task Delegation Contracts \(2\)/i)).toBeDefined();
    expect(screen.getByText('OAuth Refresh Token Task')).toBeDefined();
    expect(screen.getByText('Implement OAuth token refresh endpoint')).toBeDefined();
    expect(screen.getAllByText('AuthenticationSpecialist').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/⚡ Parallel Active/i)).toBeDefined();
  });

  it('renders quality gate completion reports and assertion metrics', () => {
    render(<AgentContractsTab tasks={mockTasks} reports={mockReports} />);
    expect(screen.getByText(/Quality Gate Completion Reports \(1\)/i)).toBeDefined();
    expect(screen.getByText('Implemented JWT refresh rotation with unit tests')).toBeDefined();
    expect(screen.getByText('passed')).toBeDefined();
  });
});
