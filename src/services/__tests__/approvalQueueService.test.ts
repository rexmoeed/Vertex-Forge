import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalQueueService } from '../approvalQueueService';

describe('ApprovalQueueService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists pending approval items', () => {
    const pending = ApprovalQueueService.listPending();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every(item => item.status === 'pending')).toBe(true);
  });

  it('lists all approval items including resolved ones', () => {
    const all = ApprovalQueueService.listAll();
    expect(all.length).toBeGreaterThan(0);
  });

  it('enqueues a new security approval request and persists it', () => {
    const item = ApprovalQueueService.enqueueItem(
      'Execute Terminal Script',
      'tool_execution',
      'high',
      'Architect Agent',
      'Requesting permission to run docker compose up',
      '+ docker compose up -d'
    );

    expect(item).toBeDefined();
    expect(item.title).toBe('Execute Terminal Script');
    expect(item.status).toBe('pending');

    const pending = ApprovalQueueService.listPending();
    expect(pending.some(p => p.id === item.id)).toBe(true);
  });

  it('resolves an item with approved decision and note', () => {
    const item = ApprovalQueueService.enqueueItem(
      'Modify Security Policy',
      'rule_override',
      'medium',
      'Lead Developer',
      'Update CORS origin rules'
    );

    const success = ApprovalQueueService.resolveItem(item.id, 'approved', 'Approved for staging deploy');
    expect(success).toBe(true);

    const all = ApprovalQueueService.listAll();
    const resolved = all.find(i => i.id === item.id);
    expect(resolved?.status).toBe('approved');
    expect(resolved?.resolutionNote).toBe('Approved for staging deploy');
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it('returns false when resolving non-existent item', () => {
    const success = ApprovalQueueService.resolveItem('invalid-item-id-999', 'rejected');
    expect(success).toBe(false);
  });
});
