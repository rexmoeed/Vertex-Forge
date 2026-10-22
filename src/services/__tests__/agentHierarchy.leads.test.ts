import { describe, it, expect } from 'vitest';
import { AgentLeadsManager } from '../agentHierarchyService.leads';

describe('AgentLeadsManager', () => {
  it('initializes 10 specialist team leads with default idle status', () => {
    const leadsManager = new AgentLeadsManager();
    const leads = leadsManager.getLeads();

    expect(leads).toHaveLength(10);
    const frontendLead = leadsManager.getLead('FrontendLead');
    expect(frontendLead).toBeDefined();
    expect(frontendLead?.title).toBe('Principal Frontend Engineer');
    expect(frontendLead?.status).toBe('idle');
  });

  it('updates lead status and increments quality gates passed', () => {
    const leadsManager = new AgentLeadsManager();
    const lead = leadsManager.getLead('BackendLead');
    const initialGates = lead?.qualityGatesPassed || 0;

    leadsManager.updateLeadStatus('BackendLead', 'working');
    expect(leadsManager.getLead('BackendLead')?.status).toBe('working');

    leadsManager.incrementGatesPassed('BackendLead');
    expect(leadsManager.getLead('BackendLead')?.qualityGatesPassed).toBe(initialGates + 1);
  });

  it('appends and retrieves agent messages in history', () => {
    const leadsManager = new AgentLeadsManager();
    leadsManager.addMessage({
      id: 'msg-1',
      fromAgent: 'FrontendLead',
      toAgent: 'UIDesignLead',
      taskId: 'task-1',
      type: 'progress_update',
      payload: { note: 'Verified colors match design system' },
      timestamp: new Date().toISOString(),
    });

    const messages = leadsManager.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('progress_update');
    expect(messages[0].payload.note).toBe('Verified colors match design system');
  });
});
