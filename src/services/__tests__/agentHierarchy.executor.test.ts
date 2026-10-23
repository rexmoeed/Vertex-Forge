import { describe, it, expect } from 'vitest';
import { AgentTaskExecutor } from '../agentHierarchyService.executor';
import { AgentTasksManager } from '../agentHierarchyService.tasks';
import { AgentLeadsManager } from '../agentHierarchyService.leads';
import { VirtualFileSystem } from '../virtualFs';

describe('AgentTaskExecutor', () => {
  it('executes a sub-agent task and produces a certified completion report', async () => {
    const vfs = new VirtualFileSystem([]);
    const leadsManager = new AgentLeadsManager();
    const tasksManager = new AgentTasksManager(vfs, leadsManager);
    const executor = new AgentTaskExecutor(vfs, leadsManager, tasksManager);

    tasksManager.delegateTask({
      taskId: 'test-exec-1',
      parentAgentId: 'FrontendLead',
      subAgentRole: 'ReactComponentBuilder',
      title: 'Build Nav Bar',
      objective: 'Render responsive navbar',
      instructions: 'Code header component',
      allowedTools: ['file_read', 'file_write'],
      workspaceScope: 'src',
      allowedFilePaths: ['src/Navbar.tsx'],
      restrictedFilePaths: ['.env'],
      dependencies: [],
      expectedDeliverables: ['Navbar component'],
      acceptanceCriteria: ['Passes lint check'],
      permissionLevel: 'write',
    });

    const report = await executor.executeSubAgentTask('test-exec-1', {
      simulateSteps: false,
      stepDelayMs: 0,
    });

    expect(report.taskId).toBe('test-exec-1');
    expect(report.approvedByLead).toBe(true);
    expect(report.testResults).toBe('passed');
    expect(report.filesModified).toContain('src/Navbar.tsx');

    // Lead quality gates incremented
    const lead = leadsManager.getLead('FrontendLead');
    expect(lead?.qualityGatesPassed).toBeGreaterThan(0);
  });

  it('enforces dependency ordering before execution', async () => {
    const vfs = new VirtualFileSystem([]);
    const leadsManager = new AgentLeadsManager();
    const tasksManager = new AgentTasksManager(vfs, leadsManager);
    const executor = new AgentTaskExecutor(vfs, leadsManager, tasksManager);

    tasksManager.delegateTask({
      taskId: 'dep-parent',
      parentAgentId: 'ArchitectureLead',
      subAgentRole: 'DependencyMapper',
      title: 'Parent Task',
      objective: 'Core architecture design',
      instructions: 'Draft architecture',
      allowedTools: ['file_read'],
      workspaceScope: 'src',
      allowedFilePaths: ['src/index.ts'],
      restrictedFilePaths: ['.env'],
      dependencies: [],
      expectedDeliverables: ['Architecture spec'],
      acceptanceCriteria: ['Valid diagram'],
      permissionLevel: 'read',
    });

    tasksManager.delegateTask({
      taskId: 'dep-child',
      parentAgentId: 'FrontendLead',
      subAgentRole: 'ReactComponentBuilder',
      title: 'Child Task',
      objective: 'Build dependent UI',
      instructions: 'Code UI',
      allowedTools: ['file_read'],
      workspaceScope: 'src',
      allowedFilePaths: ['src/App.tsx'],
      restrictedFilePaths: ['.env'],
      dependencies: ['dep-parent'],
      expectedDeliverables: ['UI spec'],
      acceptanceCriteria: ['Spec check'],
      permissionLevel: 'read',
    });

    // Attempting to execute child before parent completes should throw error
    await expect(
      executor.executeSubAgentTask('dep-child', { simulateSteps: false })
    ).rejects.toThrow(/Dependency Parent Task is not completed yet/);
  });

  it('bounds parallel concurrency settings within safe threshold', () => {
    const vfs = new VirtualFileSystem([]);
    const leadsManager = new AgentLeadsManager();
    const tasksManager = new AgentTasksManager(vfs, leadsManager);
    const executor = new AgentTaskExecutor(vfs, leadsManager, tasksManager);

    executor.setParallelConcurrency(100);
    expect(executor.getParallelConcurrency()).toBe(8);

    executor.setParallelConcurrency(-5);
    expect(executor.getParallelConcurrency()).toBe(1);

    executor.setParallelConcurrency(4);
    expect(executor.getParallelConcurrency()).toBe(4);
  });

  it('supports cancellation of active parallel workflows', () => {
    const vfs = new VirtualFileSystem([]);
    const leadsManager = new AgentLeadsManager();
    const tasksManager = new AgentTasksManager(vfs, leadsManager);
    const executor = new AgentTaskExecutor(vfs, leadsManager, tasksManager);

    executor.cancelParallelExecution();
    expect(executor.isParallelRunning()).toBe(false);
    expect(executor.getActiveParallelSubAgents()).toHaveLength(0);
  });
});
