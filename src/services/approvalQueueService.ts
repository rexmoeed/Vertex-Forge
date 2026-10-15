import { ApprovalQueueItem, ApprovalStatus, ApprovalRiskLevel } from '../types/kos';

const APPROVALS_STORAGE_KEY = 'vertex_approval_queue_v1';

export class ApprovalQueueService {
  private static queue: ApprovalQueueItem[] = [];

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(APPROVALS_STORAGE_KEY);
        if (stored) this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load approval queue:', e);
    }

    if (this.queue.length === 0) {
      this.queue = [
        {
          id: 'appr-1',
          title: 'Direct Vault Secret Access Request',
          category: 'vault_access',
          risk: 'high',
          status: 'pending',
          requester: 'Architect Agent',
          description: 'Autonomous agent requested injection of secret "openrouter-api-key" into code execution context.',
          diffSnippet: '+ Authorization: Bearer vault:openrouter-api-key',
          createdAt: Date.now() - 1800000,
        },
        {
          id: 'appr-2',
          title: 'Rulebook Override: Package Installation',
          category: 'rule_override',
          risk: 'medium',
          status: 'pending',
          requester: 'Developer Agent',
          description: 'Requesting permission to run "npm install lucide-react" in workspace.',
          diffSnippet: '+ npm install lucide-react',
          createdAt: Date.now() - 900000,
        },
      ];
      this.persist();
    }
  }

  public static listPending(): ApprovalQueueItem[] {
    return this.queue.filter(item => item.status === 'pending');
  }

  public static listAll(): ApprovalQueueItem[] {
    return [...this.queue];
  }

  public static enqueueItem(
    title: string,
    category: ApprovalQueueItem['category'],
    risk: ApprovalRiskLevel,
    requester: string,
    description: string,
    diffSnippet?: string,
    metadata?: Record<string, any>
  ): ApprovalQueueItem {
    const item: ApprovalQueueItem = {
      id: `appr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      category,
      risk,
      status: 'pending',
      requester,
      description,
      diffSnippet,
      metadata,
      createdAt: Date.now(),
    };

    this.queue.unshift(item);
    this.persist();
    return item;
  }

  public static resolveItem(id: string, decision: 'approved' | 'rejected' | 'modified', note?: string): boolean {
    const item = this.queue.find(i => i.id === id);
    if (!item) return false;
    item.status = decision;
    item.resolvedAt = Date.now();
    item.resolutionNote = note || `Resolved as ${decision} by workspace owner`;
    this.persist();
    return true;
  }

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch {}
  }
}
