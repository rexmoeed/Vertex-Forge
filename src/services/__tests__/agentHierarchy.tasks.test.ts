import { describe, it, expect } from 'vitest';
import { AgentTasksManager } from '../agentHierarchyService.tasks';
import { AgentLeadsManager } from '../agentHierarchyService.leads';
import { VirtualFileSystem } from '../virtualFs';

describe('AgentTasksManager', () => {
  it('reserves and releases file locks with conflict prevention', () => {
    const vfs = new VirtualFileSystem([]);
    const leadsManager = new AgentLeadsManager();
    const tasksManager = new AgentTasksManager(vfs, leadsManager);

    // Reserve file
    const res1 = tasksManager.reserveFile('src/App.tsx', 'sub-1', 'FrontendLead', 'exclusive_write');
    expect(res1.success).toBe(true);

    // Second write lock on same file must conflict
    const res2 = tasksManager.reserveFile('src/App.tsx', 'sub-2', 'BackendLead', 'exclusive_write');
    expect(res2.success).toBe(false);
    expect(res2.conflictWith).toBeDefined();

    // Release file
    tasksManager.releaseFile('src/App.tsx', 'sub-1');
    const res3 = tasksManager.reserveFile('src/App.tsx', 'sub-2', 'BackendLead', 'exclusive_write');
    expect(res3.success).toBe(true);
  });

  it('decomposes project goals into discrete sub-agent contracts', () => {
    const vfs = new VirtualFileSystem([]);
    const leadsManager = new AgentLeadsManager();
    const tasksManager = new AgentTasksManager(vfs, leadsManager);

    const contracts = tasksManager.decomposeProjectIntoSubTasks({ name: 'Build user profile page' });
    expect(contracts.length).toBeGreaterThan(0);
    expect(contracts[0].status).toBe('queued');
    expect(contracts[0].workspaceScope).toBeDefined();
  });
});
