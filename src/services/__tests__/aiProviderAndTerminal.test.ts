import { describe, it, expect, beforeEach } from 'vitest';
import { AIProviderService } from '../aiProviderService';
import { CodebaseIntelligenceEngine } from '../codebaseIntelligence';
import { TerminalService } from '../terminalService';
import { VirtualFileSystem } from '../virtualFs';

// Ensure localStorage is polyfilled in Node.js test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    get length() {
      return store.size;
    },
  } as any;
}

describe('Vertex Forge AI Provider Hub & Intelligent Engine Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. AI Provider Hub & BYOK Security
  describe('AIProviderService (BYOK)', () => {
    it('initializes default supported providers including Gemini, OpenAI, and Anthropic', () => {
      const providers = AIProviderService.loadProviders();
      expect(providers.length).toBeGreaterThanOrEqual(4);
      const ids = providers.map(p => p.id);
      expect(ids).toContain('gemini');
      expect(ids).toContain('openai');
      expect(ids).toContain('anthropic');
      expect(ids).toContain('custom');
      expect(ids).toContain('local');
    });

    it('masks API keys securely to prevent plaintext credential exposure', () => {
      expect(AIProviderService.maskApiKey(undefined)).toBe('Not configured');
      expect(AIProviderService.maskApiKey('')).toBe('Not configured');
      expect(AIProviderService.maskApiKey('12345')).toBe('••••••••');
      expect(AIProviderService.maskApiKey('sk-ant-api03-abcdef1234567890')).toBe('sk-a••••••••••••7890');
      expect(AIProviderService.maskApiKey('sk-proj-998877665544332211')).toBe('sk-p••••••••••••2211');
    });

    it('updates provider configuration and persists changes', () => {
      const updated = AIProviderService.updateProvider('anthropic', {
        apiKey: 'sk-ant-api03-mysecretkey',
        enabled: true,
      });
      expect(updated.apiKey).toBe('sk-ant-api03-mysecretkey');
      expect(updated.enabled).toBe(true);

      const reloaded = AIProviderService.getProvider('anthropic');
      expect(reloaded?.apiKey).toBe('sk-ant-api03-mysecretkey');
    });

    it('filters model catalog by provider and capabilities', () => {
      const allModels = AIProviderService.getAllModels();
      expect(allModels.length).toBeGreaterThanOrEqual(8);

      const reasoningModels = AIProviderService.filterModels({ capability: 'reasoning' });
      expect(reasoningModels.every(m => m.isReasoning)).toBe(true);

      const codingModels = AIProviderService.filterModels({ capability: 'coding' });
      expect(codingModels.every(m => m.isCoding)).toBe(true);

      const anthropicModels = AIProviderService.filterModels({ providerId: 'anthropic' });
      expect(anthropicModels.every(m => m.providerId === 'anthropic')).toBe(true);
    });

    it('sanitizes content and blocks .env secrets from model transmission', () => {
      const safeCheck = AIProviderService.sanitizeContentForLLM('src/App.tsx', 'export function App() {}');
      expect(safeCheck.isSafe).toBe(true);

      const envCheck = AIProviderService.sanitizeContentForLLM('.env.local', 'DATABASE_URL=postgres://...');
      expect(envCheck.isSafe).toBe(false);
      expect(envCheck.sanitized).toContain('SECURITY GUARD');
    });

    it('tracks telemetry usage and records token costs', () => {
      const initial = AIProviderService.loadUsageHistory();
      const rec = AIProviderService.recordUsage({
        providerId: 'anthropic',
        modelId: 'claude-3-7-sonnet',
        agentRole: 'Architect',
        project: 'PulseFlow',
        inputTokens: 2500,
        outputTokens: 800,
        estimatedCostUsd: 0.0195,
        durationMs: 1200,
        success: true,
        isReported: true,
      });

      expect(rec.id).toBeDefined();
      const after = AIProviderService.loadUsageHistory();
      expect(after.length).toBe(initial.length + 1);
      expect(after[0].estimatedCostUsd).toBe(0.0195);
    });
  });

  // 2. Codebase Intelligence Engine
  describe('CodebaseIntelligenceEngine', () => {
    it('classifies intents with high precision', () => {
      expect(CodebaseIntelligenceEngine.classifyIntent('Where does the dashboard get its data?').category).toBe('trace_data_flow');
      expect(CodebaseIntelligenceEngine.classifyIntent('Why does login return 401 error?').category).toBe('debug_error');
      expect(CodebaseIntelligenceEngine.classifyIntent('Explain the component structure').category).toBe('explain_code');
      expect(CodebaseIntelligenceEngine.classifyIntent('Add a new dark mode toggle component').category).toBe('generate_code');
      expect(CodebaseIntelligenceEngine.classifyIntent('Perform security audit on files').category).toBe('review_code');
    });

    it('performs hybrid search and extracts symbol definitions', () => {
      const vfs = new VirtualFileSystem([
        {
          id: '1',
          name: 'DashboardView.tsx',
          path: 'src/features/dashboard/DashboardView.tsx',
          type: 'file',
          content: `export function DashboardView() {\n  return <div>Dashboard</div>;\n}`,
        },
        {
          id: '2',
          name: 'useDashboardData.ts',
          path: 'src/features/dashboard/useDashboardData.ts',
          type: 'file',
          content: `export const useDashboardData = () => { return { data: [] }; };`,
        },
      ]);

      const result = CodebaseIntelligenceEngine.hybridSearch(vfs, 'Dashboard');
      expect(result.matchedFiles.length).toBeGreaterThan(0);
      expect(result.symbolsFound.some(s => s.name === 'DashboardView')).toBe(true);
      expect(result.symbolsFound.some(s => s.name === 'useDashboardData')).toBe(true);
    });

    it('traces architectural data flow across layers', () => {
      const vfs = new VirtualFileSystem([
        { id: '1', name: 'App.tsx', path: 'src/App.tsx', type: 'file', content: 'export default function App() {}' },
        { id: '2', name: 'Dashboard.tsx', path: 'src/components/Dashboard.tsx', type: 'file', content: 'export function Dashboard() {}' },
        { id: '3', name: 'useData.ts', path: 'src/hooks/useData.ts', type: 'file', content: 'export function useData() {}' },
        { id: '4', name: 'api.ts', path: 'src/services/apiClient.ts', type: 'file', content: 'export function fetchApi() {}' },
      ]);

      const trace = CodebaseIntelligenceEngine.traceDataFlow(vfs, 'Dashboard data');
      expect(trace.steps.length).toBeGreaterThanOrEqual(3);
      expect(trace.isComplete).toBe(true);
    });

    it('persists and isolates project memory rules', () => {
      const p1 = 'ProjectAlpha';
      const p2 = 'ProjectBeta';

      CodebaseIntelligenceEngine.addMemoryEntry(p1, {
        projectKey: p1,
        category: 'architecture',
        title: 'Use Redux Toolkit',
        details: 'Store state with RTK slices.',
      });

      const memAlpha = CodebaseIntelligenceEngine.loadProjectMemory(p1);
      const memBeta = CodebaseIntelligenceEngine.loadProjectMemory(p2);

      expect(memAlpha.some(m => m.title === 'Use Redux Toolkit')).toBe(true);
      expect(memBeta.some(m => m.title === 'Use Redux Toolkit')).toBe(false);
    });
  });

  // 3. Terminal Service
  describe('TerminalService', () => {
    it('creates default interactive terminal sessions with platform detection', () => {
      const session = TerminalService.createDefaultSession('/workspace');
      expect(session.id).toBeDefined();
      expect(session.cwd).toBe('/workspace');
      expect(['bash', 'zsh', 'powershell', 'cmd']).toContain(session.shell);
      expect(session.logs.length).toBeGreaterThanOrEqual(1);
    });

    it('executes commands and updates session logs', async () => {
      const session = TerminalService.createDefaultSession('/workspace');
      const res = await TerminalService.executeCommand(session, 'pwd');
      expect(res.exitCode).toBe(0);
      expect(session.logs.some(l => l.text === '/workspace')).toBe(true);
    });

    it('handles clear and cd builtins with accurate cwd updates', async () => {
      const session = TerminalService.createDefaultSession('/workspace');
      await TerminalService.executeCommand(session, 'cd src');
      expect(session.cwd).toBe('/workspace/src');

      await TerminalService.executeCommand(session, 'clear');
      expect(session.logs.length).toBe(0);
    });

    it('supports user interruption via Ctrl+C / interruptCommand', async () => {
      const session = TerminalService.createDefaultSession('/workspace');
      session.isRunning = true;
      session.currentExecutionId = 'exec-test-123';

      const interrupted = await TerminalService.interruptCommand(session);
      expect(interrupted).toBe(true);
      expect(session.isRunning).toBe(false);
      expect(session.logs.some(l => l.text.includes('^C'))).toBe(true);
    });

    it('extracts error context formatted for the AI Assistant', () => {
      const session = TerminalService.createDefaultSession('/workspace');
      session.logs.push({
        type: 'stderr',
        text: 'Error: Cannot find module "./missing"',
        timestamp: '10:00:00',
        exitCode: 1,
      });

      const errText = TerminalService.extractErrorContext(session);
      expect(errText).toContain('Cannot find module');
      expect(errText).toContain('/workspace');
    });
  });
});
