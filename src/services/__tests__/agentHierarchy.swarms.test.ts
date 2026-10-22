import { describe, it, expect } from 'vitest';
import { AgentSwarmsManager } from '../agentHierarchyService.swarms';
import { AgentTasksManager } from '../agentHierarchyService.tasks';
import { AgentLeadsManager } from '../agentHierarchyService.leads';
import { VirtualFileSystem } from '../virtualFs';

describe('AgentSwarmsManager', () => {
  function createSwarmsManager() {
    const vfs = new VirtualFileSystem([]);
    const leadsManager = new AgentLeadsManager();
    const tasksManager = new AgentTasksManager(vfs, leadsManager);
    return new AgentSwarmsManager(tasksManager, leadsManager);
  }

  it('creates feature-slicing swarm plan with backend, frontend, and test tasks', () => {
    const swarmsManager = createSwarmsManager();
    const plan = swarmsManager.decomposeFeatureSlicingSwarm('Authentication');

    expect(plan.type).toBe('feature-slicing');
    expect(plan.tasks.length).toBeGreaterThanOrEqual(4);
    expect(plan.status).toBe('queued');
  });

  it('spawns self-healing and background guardian swarm plans', () => {
    const swarmsManager = createSwarmsManager();
    const selfHeal = swarmsManager.spawnSelfHealingSwarm('TypeError in AuthModal', 'src/Auth.tsx');
    expect(selfHeal.type).toBe('self-healing');

    const guardians = swarmsManager.spawnBackgroundGuardiansSwarm();
    expect(guardians.type).toBe('background-guardians');
    expect(guardians.tasks.length).toBe(3);
  });
});
