import { LocalAiNode } from '../types/kos';

const NODES_STORAGE_KEY = 'vertex_local_nodes_v1';

export class LocalAiNodeService {
  private static nodes: LocalAiNode[] = [];

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(NODES_STORAGE_KEY);
        if (stored) this.nodes = JSON.parse(stored);
      }
    } catch {}

    if (this.nodes.length === 0) {
      this.nodes = [
        {
          id: 'node-ollama-local',
          name: 'Workstation GPU (Ollama)',
          host: '127.0.0.1',
          port: 11434,
          type: 'ollama',
          status: 'online',
          latencyMs: 14,
          availableModels: ['qwen2.5-coder:14b', 'deepseek-r1:14b', 'llama3.2:3b'],
          hardwareInfo: 'NVIDIA RTX 4090 (24GB VRAM)',
          lastChecked: Date.now(),
        },
        {
          id: 'node-lmstudio-lan',
          name: 'Home Lab Inference Server (LM Studio)',
          host: '192.168.1.150',
          port: 1234,
          type: 'lmstudio',
          status: 'offline',
          latencyMs: 0,
          availableModels: ['deepseek-coder-v2:16b'],
          hardwareInfo: 'Dual RTX 3090 (48GB VRAM)',
          lastChecked: Date.now() - 3600000,
        },
      ];
      this.persist();
    }
  }

  public static listNodes(): LocalAiNode[] {
    return [...this.nodes];
  }

  public static addNode(node: Omit<LocalAiNode, 'id' | 'latencyMs' | 'status' | 'lastChecked'>): LocalAiNode {
    const newNode: LocalAiNode = {
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: 'offline',
      latencyMs: 0,
      lastChecked: Date.now(),
    };
    this.nodes.push(newNode);
    this.persist();
    return newNode;
  }

  public static async pingNode(id: string): Promise<boolean> {
    const node = this.nodes.find(n => n.id === id);
    if (!node) return false;

    const start = Date.now();
    try {
      const url = `http://${node.host}:${node.port}/v1/models`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      node.latencyMs = Date.now() - start;
      node.status = res.ok ? 'online' : 'offline';
      node.lastChecked = Date.now();
      this.persist();
      return res.ok;
    } catch {
      node.status = 'unreachable';
      node.latencyMs = 0;
      node.lastChecked = Date.now();
      this.persist();
      return false;
    }
  }

  public static removeNode(id: string): boolean {
    const idx = this.nodes.findIndex(n => n.id === id);
    if (idx === -1) return false;
    this.nodes.splice(idx, 1);
    this.persist();
    return true;
  }

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(this.nodes));
      }
    } catch {}
  }
}
