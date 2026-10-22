import { PersistentMemoryEntry, MemoryType, MemoryScope } from '../types/kos';
import { logger } from './logger';

const MEMORY_STORAGE_KEY = 'vertex_persistent_memories_v1';

export class PersistentMemoryService {
  private static memories: PersistentMemoryEntry[] = [];

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
        if (stored) {
          this.memories = JSON.parse(stored);
        }
      }
    } catch (e) {
      logger.warn('Failed to load persistent memories:', e);
    }

    if (this.memories.length === 0) {
      this.memories = [
        {
          id: 'mem-1',
          type: 'preference',
          scope: 'workspace',
          scopeId: 'default',
          title: 'Testing Convention',
          content: 'Always use Vitest with describe/it blocks; avoid jest mocks where pure functions suffice.',
          source: 'User Setting',
          confidence: 1.0,
          approved: true,
          createdAt: Date.now() - 172800000,
          updatedAt: Date.now() - 172800000,
          tags: ['tests', 'vitest'],
        },
        {
          id: 'mem-2',
          type: 'fact',
          scope: 'business',
          scopeId: 'biz-core',
          title: 'Design Language',
          content: 'Vertex Forge uses Antigravity Obsidian theme tokens and pure CSS variables without Tailwind utility clashes.',
          source: 'Architecture Doc',
          confidence: 0.95,
          approved: true,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
          tags: ['css', 'theme', 'ui'],
        },
      ];
      this.persist();
    }
  }

  public static listMemories(scope?: MemoryScope, scopeId?: string): PersistentMemoryEntry[] {
    return this.memories.filter(m => {
      if (scope && m.scope !== scope) return false;
      if (scopeId && m.scopeId !== scopeId) return false;
      return true;
    });
  }

  public static proposeMemory(
    type: MemoryType,
    scope: MemoryScope,
    scopeId: string,
    title: string,
    content: string,
    source: string = 'Agent Observation',
    tags: string[] = []
  ): PersistentMemoryEntry {
    const entry: PersistentMemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      scope,
      scopeId,
      title,
      content,
      source,
      confidence: 0.9,
      approved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags,
    };

    this.memories.unshift(entry);
    this.persist();
    return entry;
  }

  public static approveMemory(id: string): boolean {
    const mem = this.memories.find(m => m.id === id);
    if (!mem) return false;
    mem.approved = true;
    mem.updatedAt = Date.now();
    this.persist();
    return true;
  }

  public static deleteMemory(id: string): boolean {
    const idx = this.memories.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.memories.splice(idx, 1);
    this.persist();
    return true;
  }

  public static queryMemories(query: string, limit = 5): PersistentMemoryEntry[] {
    const q = query.toLowerCase();
    const approved = this.memories.filter(m => m.approved);
    const scored = approved.map(m => {
      let score = 0;
      if (m.title.toLowerCase().includes(q)) score += 3;
      if (m.content.toLowerCase().includes(q)) score += 2;
      if (m.tags.some(t => t.toLowerCase().includes(q))) score += 2;
      return { mem: m, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.mem);
  }

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memories));
      }
    } catch {}
  }
}
