import { describe, it, expect, beforeEach } from 'vitest';
import { AgentHierarchyService } from '../agentHierarchyService';
import { VirtualFileSystem } from '../virtualFs';

describe('AgentHierarchyService Autonomous Decomposition & Parallel Execution', () => {
  let vfs: VirtualFileSystem;
  let service: AgentHierarchyService;

  beforeEach(() => {
    vfs = new VirtualFileSystem([]);
    // Seed initial files into mock virtual filesystem
    vfs.writeFile('src/index.ts', 'console.log("main entrypoint");');
    vfs.writeFile('src/components/App.tsx', 'export const App = () => <div>Hello</div>;');
    vfs.writeFile('package.json', JSON.stringify({ name: 'test-app', dependencies: { react: '^19.0.0' } }));
    service = new AgentHierarchyService(vfs);
  });

  describe('decomposeProjectIntoSubTasks()', () => {
    it('decomposes project into structured sub-agent task contracts with DAG dependencies', () => {
      const tasks = service.decomposeProjectIntoSubTasks(
        { name: 'Ecommerce Platform', description: 'React + Node SaaS' },
        'Build and verify authentication and cart system'
      );

      expect(tasks.length).toBeGreaterThan(0);
      expect(service.getTasks().length).toBe(tasks.length);

      // Verify task contract properties
      for (const task of tasks) {
        expect(task.taskId).toBeDefined();
        expect(task.title).toBeTruthy();
        expect(task.parentAgentId).toBeTruthy();
        expect(task.subAgentRole).toBeTruthy();
        expect(Array.isArray(task.dependencies)).toBe(true);
        expect(Array.isArray(task.acceptanceCriteria)).toBe(true);
        expect(task.objective).toBeTruthy();
        expect(task.permissionLevel).toBeDefined();
      }

      // Root task should be queued
      const rootTasks = tasks.filter(t => t.dependencies.length === 0);
      expect(rootTasks.length).toBeGreaterThan(0);
      expect(rootTasks[0].status).toBe('queued');

      // Dependent tasks should be waiting_dependency
      const depTasks = tasks.filter(t => t.dependencies.length > 0);
      if (depTasks.length > 0) {
        expect(depTasks[0].status).toBe('waiting_dependency');
      }
    });

    it('assigns realistic team leads based on project needs', () => {
      const tasks = service.decomposeProjectIntoSubTasks({ name: 'API Server' });
      const parentLeads = new Set(tasks.map(t => t.parentAgentId));

      expect(parentLeads.size).toBeGreaterThan(1);
      const leads = service.getLeads();
      expect(leads.length).toBe(10);
    });
  });

  describe('executeAllTasksParallel()', () => {
    it('executes all tasks in parallel with progress notifications and completion reports', async () => {
      service.decomposeProjectIntoSubTasks({ name: 'Benchmarking App' });
      const progressUpdates: number[] = [];

      const reports = await service.executeAllTasksParallel({
        concurrency: 3,
        stepDelayMs: 2,
        onProgress: info => {
          progressUpdates.push(info.percent);
        },
      });

      expect(reports.length).toBeGreaterThan(0);
      expect(service.isParallelRunning()).toBe(false);

      // Check progress reached 100
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);

      // Verify completion reports
      for (const report of reports) {
        expect(report.taskId).toBeDefined();
        expect(report.subAgentRole).toBeDefined();
        expect(report.approvedByLead).toBe(true);
        expect(report.workCompleted).toBeTruthy();
      }
    });

    it('supports runtime cancellation', async () => {
      service.decomposeProjectIntoSubTasks({ name: 'Cancellation Test' });
      const executionPromise = service.executeAllTasksParallel({
        concurrency: 2,
        stepDelayMs: 50,
      });

      // Trigger cancel mid-execution
      setTimeout(() => {
        service.cancelParallelExecution();
      }, 10);

      await executionPromise;
      expect(service.isParallelRunning()).toBe(false);
    });
  });

  describe('File Reservations & Conflict Avoidance', () => {
    it('reserves and releases files without deadlocks', () => {
      const res1 = service.reserveFile('src/index.ts', 'agent-1', 'FrontendLead', 'exclusive_write');
      expect(res1.success).toBe(true);

      const res2 = service.reserveFile('src/index.ts', 'agent-2', 'BackendLead', 'exclusive_write');
      expect(res2.success).toBe(false);
      expect(res2.conflictWith).toBe('agent-1');

      service.releaseFile('src/index.ts', 'agent-1');
      const res3 = service.reserveFile('src/index.ts', 'agent-2', 'BackendLead', 'exclusive_write');
      expect(res3.success).toBe(true);
    });
  });
});
