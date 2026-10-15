import { BusinessEntity, BusinessTrackerItem, TrackerStatus } from '../types/kos';

const BUSINESSES_STORAGE_KEY = 'vertex_businesses_v1';
const TRACKER_STORAGE_KEY = 'vertex_business_trackers_v1';

export class BusinessTrackerService {
  private static businesses: BusinessEntity[] = [];
  private static trackerItems: BusinessTrackerItem[] = [];
  private static activeBusinessId: string = 'biz-1';

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedBiz = localStorage.getItem(BUSINESSES_STORAGE_KEY);
        if (storedBiz) this.businesses = JSON.parse(storedBiz);
        const storedItems = localStorage.getItem(TRACKER_STORAGE_KEY);
        if (storedItems) this.trackerItems = JSON.parse(storedItems);
      }
    } catch (e) {
      console.warn('Failed to load business tracker data:', e);
    }

    if (this.businesses.length === 0) {
      this.businesses = [
        {
          id: 'biz-1',
          name: 'Vertex Forge Core',
          description: 'Primary IDE desktop editor, terminal runtime, and UI workbench',
          color: '#6366f1',
          monthlyBudgetUsd: 150.0,
          spentBudgetUsd: 18.45,
          workspacePaths: ['/workspace', 'e:/Vertex Forge/Vertex-Forge-main', 'e:/Vertex Forge/Vertex-Forge-main'],
          rulesCount: 5,
          secretsCount: 2,
        },
        {
          id: 'biz-2',
          name: 'AI Infrastructure',
          description: 'Model routing, council coordination, and prompt pipelines',
          color: '#00ff88',
          monthlyBudgetUsd: 250.0,
          spentBudgetUsd: 42.1,
          workspacePaths: ['/workspace/ai-engine'],
          rulesCount: 3,
          secretsCount: 4,
        },
        {
          id: 'biz-3',
          name: 'Enterprise Cloud',
          description: 'Backend services, multi-tenant authentication, and licensing',
          color: '#38bdf8',
          monthlyBudgetUsd: 200.0,
          spentBudgetUsd: 5.3,
          workspacePaths: ['/workspace/server'],
          rulesCount: 4,
          secretsCount: 3,
        },
        {
          id: 'biz-4',
          name: 'Desktop & Native Clients',
          description: 'Electron Windows installer, macOS package, and PTY bindings',
          color: '#f59e0b',
          monthlyBudgetUsd: 100.0,
          spentBudgetUsd: 8.9,
          workspacePaths: ['/workspace/electron'],
          rulesCount: 2,
          secretsCount: 1,
        },
        {
          id: 'biz-5',
          name: 'Security & Compliance',
          description: 'Rulebook hard gates, secret scanner, and audit logging',
          color: '#f43f5e',
          monthlyBudgetUsd: 100.0,
          spentBudgetUsd: 2.1,
          workspacePaths: ['/workspace/security'],
          rulesCount: 8,
          secretsCount: 2,
        },
        {
          id: 'biz-6',
          name: 'Labs & Research',
          description: 'Autonomous multi-agent swarms and local LAN inference testing',
          color: '#a855f7',
          monthlyBudgetUsd: 75.0,
          spentBudgetUsd: 12.0,
          workspacePaths: ['/workspace/labs'],
          rulesCount: 1,
          secretsCount: 1,
        },
      ];
      this.persist();
    }

    if (this.trackerItems.length === 0) {
      this.trackerItems = [
        {
          id: 'task-101',
          businessId: 'biz-1',
          title: 'Implement in-app Open Folder modal with zero Chrome native popups',
          description: 'Replace showDirectoryPicker with real filesystem browser modal.',
          status: 'done',
          priority: 'critical',
          createdAt: Date.now() - 3600000 * 5,
          updatedAt: Date.now() - 3600000 * 2,
        },
        {
          id: 'task-102',
          businessId: 'biz-2',
          title: 'Dynamic OpenRouter catalog and live credit verification',
          description: 'Fetch 400+ models dynamically and test keys via /auth/key endpoint.',
          status: 'done',
          priority: 'high',
          createdAt: Date.now() - 3600000 * 4,
          updatedAt: Date.now() - 3600000 * 1,
        },
        {
          id: 'task-103',
          businessId: 'biz-1',
          title: 'Responsive layout permanent bottom cut-off fix across all screen heights',
          description: 'Remove calc offsets, enforce flexbox min-h-0 and shrink-0 on status bar.',
          status: 'done',
          priority: 'high',
          createdAt: Date.now() - 3600000 * 3,
          updatedAt: Date.now() - 3600000 * 1,
        },
        {
          id: 'task-104',
          businessId: 'biz-5',
          title: 'Implement hard rulebook gates and credential vault with secret redaction',
          description: 'Strict pre-execution checks and AES-backed credential store.',
          status: 'in_progress',
          priority: 'critical',
          createdAt: Date.now() - 3600000 * 2,
          updatedAt: Date.now(),
        },
      ];
      this.persist();
    }
  }

  public static listBusinesses(): BusinessEntity[] {
    return [...this.businesses];
  }

  public static getActiveBusiness(): BusinessEntity {
    return this.businesses.find(b => b.id === this.activeBusinessId) || this.businesses[0];
  }

  public static setActiveBusiness(id: string): void {
    if (this.businesses.some(b => b.id === id)) {
      this.activeBusinessId = id;
    }
  }

  public static listTrackerItems(businessId?: string): BusinessTrackerItem[] {
    const target = businessId || this.activeBusinessId;
    return this.trackerItems.filter(item => item.businessId === target);
  }

  public static addTrackerItem(item: Omit<BusinessTrackerItem, 'id' | 'createdAt' | 'updatedAt'>): BusinessTrackerItem {
    const newItem: BusinessTrackerItem = {
      ...item,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.trackerItems.push(newItem);
    this.persist();
    return newItem;
  }

  public static moveTrackerItem(itemId: string, newStatus: TrackerStatus): boolean {
    const item = this.trackerItems.find(i => i.id === itemId);
    if (!item) return false;
    item.status = newStatus;
    item.updatedAt = Date.now();
    this.persist();
    return true;
  }

  public static deleteTrackerItem(itemId: string): boolean {
    const idx = this.trackerItems.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    this.trackerItems.splice(idx, 1);
    this.persist();
    return true;
  }

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(this.businesses));
        localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(this.trackerItems));
      }
    } catch {}
  }
}
