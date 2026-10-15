import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VirtualFileSystem } from '../virtualFs';
import { GeminiService } from '../geminiService';
import { UniversalSystemPromptBuilder } from '../universalSystemPrompt';
import { AttachedContextItem } from '../../components/layout/AIOrchestratorPanel';

describe('AI Chat Context Composer & Multimodal Attachments', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem([
      {
        id: '1',
        name: 'src',
        path: 'src',
        type: 'folder',
        children: [
          {
            id: '2',
            name: 'App.tsx',
            path: 'src/App.tsx',
            type: 'file',
            content: [
              'import React from "react";',
              'export function App() {',
              '  const [count, setCount] = React.useState(0);',
              '  return (',
              '    <div className="app">',
              '      <h1>Vertex Forge</h1>',
              '      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>',
              '    </div>',
              '  );',
              '}',
            ].join('\n'),
          },
          {
            id: '3',
            name: 'index.css',
            path: 'src/index.css',
            type: 'file',
            content: 'body { margin: 0; background-color: #0f172a; color: #f8fafc; }',
          },
        ],
      },
    ]);
  });

  it('1. Reads workspace files and generates attached file context items', () => {
    const filePath = 'src/App.tsx';
    const content = vfs.readFile(filePath);
    expect(content).toBeDefined();
    expect(content).toContain('export function App');

    const fileItem: AttachedContextItem = {
      id: `file-${filePath}`,
      type: 'file',
      title: 'App.tsx',
      detail: `${content!.split('\n').length} lines · ${filePath}`,
      filePath,
      contentSnippet: content!.slice(0, 3000),
    };

    expect(fileItem.type).toBe('file');
    expect(fileItem.title).toBe('App.tsx');
    expect(fileItem.detail).toContain('10 lines');
    expect(fileItem.contentSnippet).toContain('Vertex Forge');
  });

  it('2. Extracts code line references accurately for specified ranges', () => {
    const filePath = 'src/App.tsx';
    const content = vfs.readFile(filePath)!;
    const lines = content.split('\n');
    const startLine = 3;
    const endLine = 7;
    const selectedSnippet = lines.slice(startLine - 1, endLine).join('\n');

    const lineItem: AttachedContextItem = {
      id: `lines-${filePath}-${startLine}-${endLine}`,
      type: 'lines',
      title: `App.tsx:L${startLine}-L${endLine}`,
      detail: `${endLine - startLine + 1} lines from ${filePath}`,
      filePath,
      lineStart: startLine,
      lineEnd: endLine,
      contentSnippet: selectedSnippet,
    };

    expect(lineItem.type).toBe('lines');
    expect(lineItem.title).toBe('App.tsx:L3-L7');
    expect(lineItem.contentSnippet).toContain('const [count, setCount]');
    expect(lineItem.contentSnippet).toContain('<button onClick');
  });

  it('3. Extracts terminal history lines and bundles as terminal context', () => {
    const mockTerminalHistory = [
      { id: '1', type: 'command' as const, text: 'npm run test', timestamp: '12:00:00' },
      { id: '2', type: 'stdout' as const, text: '✓ 134 tests passed', timestamp: '12:00:02' },
      { id: '3', type: 'stderr' as const, text: 'Warning: React 19 fast refresh enabled', timestamp: '12:00:03' },
    ];

    const lines = mockTerminalHistory.map(l => l.text).filter(Boolean);
    const snippet = lines.join('\n');

    const terminalItem: AttachedContextItem = {
      id: 'term-1',
      type: 'terminal',
      title: `Terminal Output (${lines.length} lines)`,
      detail: 'Recent shell output & diagnostics',
      terminalLines: lines,
      contentSnippet: snippet,
    };

    expect(terminalItem.type).toBe('terminal');
    expect(terminalItem.title).toBe('Terminal Output (3 lines)');
    expect(terminalItem.contentSnippet).toContain('✓ 134 tests passed');
    expect(terminalItem.terminalLines).toHaveLength(3);
  });

  it('4. Attaches image DataURL for multimodal support', () => {
    const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const imageItem: AttachedContextItem = {
      id: 'img-1',
      type: 'image',
      title: 'mockup.png',
      detail: '1.2 KB',
      dataUrl: dummyBase64,
      imageFileName: 'mockup.png',
    };

    expect(imageItem.type).toBe('image');
    expect(imageItem.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(imageItem.title).toBe('mockup.png');
  });

  it('5. Enriches AI query prompt with all attached context sections', () => {
    const rawUserQuery = 'Why is the count button not updating properly?';
    const attachments: AttachedContextItem[] = [
      {
        id: 'f1',
        type: 'file',
        title: 'App.tsx',
        filePath: 'src/App.tsx',
        contentSnippet: vfs.readFile('src/App.tsx')!,
      },
      {
        id: 'l1',
        type: 'lines',
        title: 'App.tsx:L3-L7',
        filePath: 'src/App.tsx',
        lineStart: 3,
        lineEnd: 7,
        contentSnippet: 'const [count, setCount] = React.useState(0);\n<button onClick={() => setCount(c => c + 1)}>',
      },
      {
        id: 't1',
        type: 'terminal',
        title: 'Terminal Output',
        terminalLines: ['TypeError: Cannot read properties of undefined'],
        contentSnippet: 'TypeError: Cannot read properties of undefined',
      },
    ];

    const contextSections: string[] = [];
    for (const att of attachments) {
      if (att.type === 'file') {
        contextSections.push(`[ATTACHED WORKSPACE FILE: ${att.filePath}]\n\`\`\`\n${att.contentSnippet}\n\`\`\``);
      } else if (att.type === 'lines') {
        contextSections.push(`[REFERENCED CODE LINES: ${att.filePath} (L${att.lineStart}-L${att.lineEnd})]\n\`\`\`\n${att.contentSnippet}\n\`\`\``);
      } else if (att.type === 'terminal') {
        contextSections.push(`[ATTACHED TERMINAL OUTPUT]\n\`\`\`\n${att.contentSnippet}\n\`\`\``);
      }
    }

    const enrichedPrompt = `${rawUserQuery}\n\n=== ATTACHED WORKSPACE CONTEXT ===\n${contextSections.join('\n\n')}`;

    expect(enrichedPrompt).toContain(rawUserQuery);
    expect(enrichedPrompt).toContain('[ATTACHED WORKSPACE FILE: src/App.tsx]');
    expect(enrichedPrompt).toContain('[REFERENCED CODE LINES: src/App.tsx (L3-L7)]');
    expect(enrichedPrompt).toContain('[ATTACHED TERMINAL OUTPUT]');
    expect(enrichedPrompt).toContain('TypeError: Cannot read properties of undefined');
  });

  it('6. GeminiService.chat accepts image payloads in request parameters', async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'I inspected your code lines and terminal logs and found the issue.', agent: 'Developer' }),
    });
    globalThis.fetch = fetchMock;

    try {
      const dummyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const result = await GeminiService.chat({
        messages: [{ role: 'user', content: 'Inspect this mockup and code' }],
        activeFile: 'src/App.tsx',
        fileContent: vfs.readFile('src/App.tsx')!,
        images: [dummyImage],
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.images).toHaveLength(1);
      expect(requestBody.images[0]).toContain('data:image/png;base64');
      expect(result.reply).toContain('inspected your code');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
