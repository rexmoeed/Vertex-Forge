import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraphService } from '../knowledgeGraphService';

describe('KnowledgeGraphService', () => {
  beforeEach(() => {
    KnowledgeGraphService.rebuildGraph([
      'src/App.tsx',
      'src/context/IDEContext.tsx',
      'src/services/aiProviderService.ts',
      'src/services/credentialVaultService.ts',
      'server.ts',
    ]);
  });

  it('builds knowledge graph nodes and connected dependency edges', () => {
    const graph = KnowledgeGraphService.getGraph();
    expect(graph.nodes.length).toBe(5);
    expect(graph.edges.length).toBeGreaterThan(0);

    const appNode = graph.nodes.find(n => n.id === 'src/App.tsx');
    expect(appNode).toBeDefined();
    expect(appNode?.label).toBe('App.tsx');
  });

  it('queries related symbols and tracks incoming/outgoing edges', () => {
    const query = KnowledgeGraphService.queryGraph('IDEContext');
    expect(query.relatedNodes.length).toBeGreaterThan(0);
    expect(query.incoming.some(e => e.source === 'src/App.tsx')).toBe(true);
    expect(query.outgoing.some(e => e.target === 'src/services/aiProviderService.ts')).toBe(true);
  });

  it('returns empty collections when querying an unknown node', () => {
    const query = KnowledgeGraphService.queryGraph('non_existent_file_xyz.ts');
    expect(query.relatedNodes).toEqual([]);
    expect(query.incoming).toEqual([]);
    expect(query.outgoing).toEqual([]);
  });

  it('rebuilds graph on demand with arbitrary workspace file list', () => {
    const graph = KnowledgeGraphService.rebuildGraph(['main.py', 'utils.py']);
    expect(graph.nodeCount).toBe(2);
    expect(graph.nodes[0].label).toBe('main.py');
    expect(graph.edges.length).toBe(0);
  });
});
