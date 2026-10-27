import { describe, it, expect } from 'vitest';
import { AVAILABLE_TOOLS } from '../universalToolsDefinition';
import { UniversalToolExecutor } from '../universalToolExecutor';
import { UniversalSystemPromptBuilder } from '../../universalSystemPrompt';
import { VirtualFileSystem } from '../../virtualFs';

describe('Universal System Prompt & Tool Executor Suite', () => {
  it('provides all 9 real tools in AVAILABLE_TOOLS', () => {
    expect(AVAILABLE_TOOLS.length).toBe(9);
    const names = AVAILABLE_TOOLS.map(t => t.name);
    expect(names).toContain('fs_read_file');
    expect(names).toContain('fs_write_file');
    expect(names).toContain('terminal_execute');
    expect(names).toContain('run_tests');
  });

  it('builds system prompt with verified evidence', () => {
    const prompt = UniversalSystemPromptBuilder.buildSystemPrompt({
      userPrompt: 'Fix bug in component',
      activeFile: 'src/App.tsx',
      projectProfile: {
        id: '1',
        rootPath: '/app',
        name: 'Vertex Forge',
        isLocalFilesystem: true,
        languages: ['TypeScript'],
        frameworks: ['React', 'Vite'],
        libraries: [],
        packageManager: 'npm',
        scripts: { test: 'vitest run' },
        dependencies: {},
        devDependencies: {},
        health: { score: 100 } as any,
        detectedAt: '',
        lastOpenedAt: '',
      },
      includeTools: true,
    });

    expect(prompt).toContain('Vertex Forge Autonomous Engineering Agent');
    expect(prompt).toContain('Project Name: Vertex Forge');
    expect(prompt).toContain('fs_read_file');
  });

  it('executes VFS operations via UniversalToolExecutor', async () => {
    const vfs = new VirtualFileSystem([]);
    vfs.writeFile('hello.txt', 'Hello Vertex Forge');

    const readRes = await UniversalToolExecutor.executeTool('fs_read_file', { filePath: 'hello.txt' }, vfs);
    expect(readRes.success).toBe(true);
    expect(readRes.result.content).toBe('Hello Vertex Forge');

    const writeRes = await UniversalToolExecutor.executeTool(
      'fs_write_file',
      { filePath: 'output.txt', content: 'Sample' },
      vfs
    );
    expect(writeRes.success).toBe(true);
    expect(vfs.readFile('output.txt')).toBe('Sample');
  });
});
