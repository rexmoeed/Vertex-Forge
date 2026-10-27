import { describe, it, expect } from 'vitest';
import { ConcreteAiRuntime, ConcreteIntentEngine, ConcreteSystemPromptBuilder } from '../../concreteAiRuntime';
import { ConcreteFileSystemService } from '../concreteFileSystemService';
import { VirtualFileSystem } from '../../virtualFs';

describe('ConcreteAiRuntime Subsystem', () => {
  it('classifies intents accurately via ConcreteIntentEngine', async () => {
    const engine = new ConcreteIntentEngine();
    const testIntent = await engine.classify({ userMessage: 'Run all vitest tests' });
    expect(testIntent.intent).toBe('test');
    expect(testIntent.suggestedRole).toBe('Testing');

    const debugIntent = await engine.classify({ userMessage: 'Fix this null pointer exception' });
    expect(debugIntent.intent).toBe('debug');
    expect(debugIntent.suggestedRole).toBe('Debugger');
  });

  it('builds system prompt correctly via ConcreteSystemPromptBuilder', async () => {
    const builder = new ConcreteSystemPromptBuilder();
    const prompt = await builder.build({
      mode: 'agent',
      model: { providerId: 'google', modelId: 'gemini-3.8-flash' },
      context: {
        relevantFiles: [],
        symbols: [],
        dependencies: [],
        instructions: ['Ensure test safety'],
        evidence: [],
      },
      tools: [{ name: 'vitest_run', description: 'Run test suite', permission: 'safe', inputSchema: {} }],
      autonomy: {
        allowFileRead: true,
        allowFileWrite: true,
        allowTerminal: true,
        allowProcessControl: false,
        allowGit: false,
        allowNetwork: false,
        requireConfirmationForDestructive: false,
        maxToolCalls: 5,
        maxRuntimeMs: 10000,
      },
    });

    expect(prompt).toContain('Vertex Forge');
    expect(prompt).toContain('vitest_run');
    expect(prompt).toContain('AllowFileWrite: true');
  });

  it('executes runtime request via ConcreteAiRuntime', async () => {
    const runtime = new ConcreteAiRuntime();
    const res = await runtime.execute({
      requestId: 'req-42',
      userMessage: 'Test feature',
      mode: 'agent',
      autonomy: {
        allowFileRead: true,
        allowFileWrite: true,
        allowTerminal: true,
        allowProcessControl: false,
        allowGit: false,
        allowNetwork: false,
        requireConfirmationForDestructive: false,
        maxToolCalls: 5,
        maxRuntimeMs: 10000,
      },
    });

    expect(res.requestId).toBe('req-42');
    expect(res.reply).toContain('gemini-3.8-flash');
  });

  it('performs VFS file operations via ConcreteFileSystemService', async () => {
    const vfs = new VirtualFileSystem([]);
    const fsService = new ConcreteFileSystemService(vfs);

    await fsService.createFile({ path: 'src/sample.ts', initialContent: 'export const val = 42;' });
    const read = await fsService.readFile({ path: 'src/sample.ts' });
    expect(read.content).toBe('export const val = 42;');

    const exists = await fsService.exists('src/sample.ts');
    expect(exists).toBe(true);
  });
});
