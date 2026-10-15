import { KnowledgeGraph, KnowledgeNode, KnowledgeEdge } from '../types/kos';

const GRAPH_STORAGE_KEY = 'vertex_knowledge_graph_v1';

export class KnowledgeGraphService {
  private static graph: KnowledgeGraph = {
    nodes: [],
    edges: [],
    lastBuilt: 0,
    nodeCount: 0,
    edgeCount: 0,
  };

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(GRAPH_STORAGE_KEY);
        if (stored) this.graph = JSON.parse(stored);
      }
    } catch {}

    if (this.graph.nodes.length === 0) {
      this.rebuildGraph([
        'src/App.tsx',
        'src/context/IDEContext.tsx',
        'src/services/aiProviderService.ts',
        'src/services/credentialVaultService.ts',
        'src/services/rulebookEngine.ts',
        'server.ts',
      ]);
    }
  }

  public static getGraph(): KnowledgeGraph {
    return this.graph;
  }

  public static rebuildGraph(files: string[]): KnowledgeGraph {
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    for (const f of files) {
      const fileName = f.split('/').pop() || f;
      nodes.push({
        id: f,
        label: fileName,
        type: 'file',
        metadata: { path: f, size: 1024 },
      });
    }

    // Connect dependencies
    if (files.includes('src/App.tsx') && files.includes('src/context/IDEContext.tsx')) {
      edges.push({ source: 'src/App.tsx', target: 'src/context/IDEContext.tsx', relation: 'imports' });
    }
    if (files.includes('src/context/IDEContext.tsx') && files.includes('src/services/aiProviderService.ts')) {
      edges.push({ source: 'src/context/IDEContext.tsx', target: 'src/services/aiProviderService.ts', relation: 'calls' });
    }
    if (files.includes('src/context/IDEContext.tsx') && files.includes('src/services/credentialVaultService.ts')) {
      edges.push({ source: 'src/context/IDEContext.tsx', target: 'src/services/credentialVaultService.ts', relation: 'calls' });
    }
    if (files.includes('server.ts') && files.includes('src/services/aiProviderService.ts')) {
      edges.push({ source: 'server.ts', target: 'src/services/aiProviderService.ts', relation: 'documents' });
    }

    this.graph = {
      nodes,
      edges,
      lastBuilt: Date.now(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
    };

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(this.graph));
      }
    } catch {}

    return this.graph;
  }

  public static queryGraph(symbolOrFile: string): { relatedNodes: KnowledgeNode[]; incoming: KnowledgeEdge[]; outgoing: KnowledgeEdge[] } {
    const q = symbolOrFile.toLowerCase();
    const targetNode = this.graph.nodes.find(n => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q));

    if (!targetNode) {
      return { relatedNodes: [], incoming: [], outgoing: [] };
    }

    const incoming = this.graph.edges.filter(e => e.target === targetNode.id);
    const outgoing = this.graph.edges.filter(e => e.source === targetNode.id);

    const relatedIds = new Set([...incoming.map(e => e.source), ...outgoing.map(e => e.target)]);
    const relatedNodes = this.graph.nodes.filter(n => relatedIds.has(n.id));

    return { relatedNodes, incoming, outgoing };
  }
}
