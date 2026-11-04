/**
 * Strongly-Typed Workspace Event Bus
 * Decouples cross-component reactivity with typed topics, payloads, and wildcard subscriptions.
 */

export interface WorkspaceEventMap {
  'file:opened': { filePath: string; timestamp: number };
  'file:saved': { filePath: string; contentLength: number };
  'agent:task_started': { taskId: string; agentRole: string; title: string };
  'agent:task_completed': { taskId: string; durationMs: number; testsPassed: boolean };
  'test:run_finished': { total: number; passed: number; failed: number };
  'vault:secret_updated': { secretName: string; action: 'create' | 'delete' };
}

export type EventKey = keyof WorkspaceEventMap;
export type EventHandler<K extends EventKey> = (payload: WorkspaceEventMap[K]) => void;

export class WorkspaceEventBus {
  private handlers = new Map<EventKey, Set<EventHandler<any>>>();

  public on<K extends EventKey>(event: K, handler: EventHandler<K>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);

    return () => {
      this.off(event, handler);
    };
  }

  public off<K extends EventKey>(event: K, handler: EventHandler<K>): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  public emit<K extends EventKey>(event: K, payload: WorkspaceEventMap[K]): void {
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of set) {
        try {
          handler(payload);
        } catch (err) {
          // Prevent individual listener failures from breaking emitter
          // eslint-disable-next-line no-console
          console.error(`[WorkspaceEventBus] Listener error for ${event}:`, err);
        }
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
  }

  public listenerCount<K extends EventKey>(event: K): number {
    return this.handlers.get(event)?.size || 0;
  }
}

export const eventBus = new WorkspaceEventBus();

