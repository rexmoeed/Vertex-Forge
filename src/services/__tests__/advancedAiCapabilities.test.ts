import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalLLMService } from '../localLLMService';
import { GhostAutocompleteService } from '../ghostAutocompleteService';
import { VisionToComponentService } from '../visionToComponentService';
import { ShadowSandboxService } from '../shadowSandboxService';
import { VirtualFileSystem } from '../virtualFs';
import { AgentHierarchyService } from '../agentHierarchyService';

describe('Vertex Forge - Advanced AI Capabilities Suite', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem([]);
    vfs.writeFile('src/App.tsx', 'export default function App() { return <div>App</div>; }');
    vfs.writeFile('src/services/api.ts', 'export const fetchData = () => ({ status: 200 });');
    GhostAutocompleteService.clearCache();
    ShadowSandboxService.clearAllSessions();
  });

  describe('1. Local LLMs / DeepSeek / Ollama Integration', () => {
    it('queries and parses Ollama models on healthcheck', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            {
              name: 'deepseek-coder-v2:16b',
              size: 8900000000,
              details: { parameter_size: '16B', quantization_level: 'Q4_K_M' },
            },
            {
              name: 'qwen2.5-coder:7b',
              size: 4700000000,
              details: { parameter_size: '7B', quantization_level: 'Q5_K_M' },
            },
          ],
        }),
      });

      LocalLLMService.setFetchClient(mockFetch as any);

      const status = await LocalLLMService.checkEndpointHealth('ollama');
      expect(status.status).toBe('online');
      expect(status.availableModels).toHaveLength(2);
      expect(status.availableModels[0].name).toBe('deepseek-coder-v2:16b');
      expect(status.availableModels[0].isCodingSpecialist).toBe(true);
      expect(status.availableModels[0].family).toBe('deepseek');
      expect(status.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('executes local chat completion and code generation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: { content: 'export const sum = (a: number, b: number) => a + b;' },
          model: 'deepseek-coder-v2:latest',
          prompt_eval_count: 32,
          eval_count: 14,
        }),
      });

      LocalLLMService.setFetchClient(mockFetch as any);

      const res = await LocalLLMService.chatCompletion({
        messages: [{ role: 'user', content: 'write sum function' }],
      });

      expect(res.content).toContain('export const sum');
      expect(res.isLocal).toBe(true);
      expect(res.tokensGenerated).toBe(14);
    });

    it('enforces privacy mode when local endpoint is unreachable', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      LocalLLMService.setFetchClient(mockFetch as any);

      LocalLLMService.setPrivacyMode(true);
      await expect(
        LocalLLMService.chatCompletion({
          messages: [{ role: 'user', content: 'test prompt' }],
        })
      ).rejects.toThrow('Privacy Mode is active');

      LocalLLMService.setPrivacyMode(false);
      const fallback = await LocalLLMService.chatCompletion({
        messages: [{ role: 'user', content: 'test prompt' }],
      });
      expect(fallback.isLocal).toBe(true);
      expect(fallback.content).toContain('Vertex Forge Local AI Fallback');
    });
  });

  describe('2. Inline Ghost-Text Speculative Autocomplete', () => {
    it('provides instant heuristic completions for TypeScript patterns', async () => {
      const suggestion = await GhostAutocompleteService.requestCompletion({
        fileUri: 'src/types/user.ts',
        language: 'typescript',
        prefix: 'export interface UserProfile {\n',
        suffix: '',
        lineNumber: 1,
        column: 32,
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion?.insertText).toContain('id: string;');
      expect(suggestion?.source).toBe('heuristic_ast');
      expect(suggestion?.confidence).toBeGreaterThan(0.9);
    });

    it('provides instant React useState snippet completion', async () => {
      const suggestion = await GhostAutocompleteService.requestCompletion({
        fileUri: 'src/components/MyView.tsx',
        language: 'typescriptreact',
        prefix: 'const [isLoading, setIsLoading] = useState<boolean>',
        suffix: '',
        lineNumber: 5,
        column: 52,
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion?.insertText).toBe('(false);\n');
    });

    it('tracks Tab-to-accept and updates acceptance rate metrics', async () => {
      await GhostAutocompleteService.requestCompletion({
        fileUri: 'src/test.ts',
        language: 'typescript',
        prefix: 'try {\n',
        suffix: '',
        lineNumber: 1,
        column: 5,
      });

      const accepted = GhostAutocompleteService.acceptCurrentSuggestion();
      expect(accepted).not.toBeNull();
      expect(accepted?.insertText).toContain('catch (error)');

      const stats = GhostAutocompleteService.getStats();
      expect(stats.suggestionsOffered).toBeGreaterThanOrEqual(1);
      expect(stats.suggestionsAccepted).toBe(1);
      expect(stats.acceptanceRatePercent).toBe(100);
    });
  });

  describe('3. Screenshot / Mockup to Component Service', () => {
    it('synthesizes production-ready React 19 component with design tokens', async () => {
      const result = await VisionToComponentService.synthesizeComponentFromImage({
        imageDataOrUrl: 'mockup_dashboard_dark_theme.png',
        componentName: 'AnalyticsDashboard',
        styling: 'vanilla_css',
        additionalPrompt: 'Include MetricsDisplay, StatusBadge, and ActionButton',
      });

      expect(result.componentName).toBe('AnalyticsDashboard');
      expect(result.fileName).toBe('src/components/AnalyticsDashboard.tsx');
      expect(result.code).toContain('export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps>');
      expect(result.detectedElements).toContain('StatusBadge');
      expect(result.code).toContain('analyticsdashboard-badge');
      expect(result.code).toContain('import React, { useState } from \'react\';');
      expect(result.styles).toBeDefined();
      expect(result.styles).toContain('--analyticsdashboard-primary:');
      expect(result.designTokens.colors.primary).toBe('#6366f1');
    });

    it('saves synthesized component and styles into VirtualFileSystem', () => {
      const result = {
        id: 'vision-test',
        componentName: 'NavbarCard',
        fileName: 'src/components/NavbarCard.tsx',
        code: 'export const NavbarCard = () => <div>Navbar</div>;',
        styles: '.navbarcard-container { display: flex; }',
        designTokens: VisionToComponentService.extractDesignTokens('light'),
        detectedElements: ['Container'],
        confidenceScore: 0.95,
        generatedAt: Date.now(),
      };

      const files = VisionToComponentService.saveToVirtualFs(vfs, result);
      expect(files).toContain('src/components/NavbarCard.tsx');
      expect(files).toContain('src/components/NavbarCard.css');
      expect(vfs.readFile('src/components/NavbarCard.tsx')).toBe(result.code);
      expect(vfs.readFile('src/components/NavbarCard.css')).toBe(result.styles);
    });
  });

  describe('4. Shadow Sandbox Auto-Verification (Devin-Style)', () => {
    it('stages mutations in virtual shadow without affecting active VFS', () => {
      const session = ShadowSandboxService.createSession(vfs);
      const staging = ShadowSandboxService.stageMutations(session.sessionId, [
        {
          path: 'src/services/newModule.ts',
          type: 'create',
          content: 'export const answer = 42;',
        },
      ]);

      expect(staging.success).toBe(true);
      expect(staging.stagedCount).toBe(1);
      // Real VFS must not have the file yet
      expect(vfs.exists('src/services/newModule.ts')).toBe(false);
    });

    it('verifies syntax, relative import integrity, and executes atomic commit', async () => {
      const session = ShadowSandboxService.createSession(vfs);
      ShadowSandboxService.stageMutations(session.sessionId, [
        {
          path: 'src/services/consumer.ts',
          type: 'create',
          content: "import { fetchData } from './api';\nexport const run = () => fetchData();",
        },
      ]);

      const report = await ShadowSandboxService.runAutoVerification(session.sessionId);
      expect(report.passed).toBe(true);
      expect(report.syntaxChecksPassed).toBe(true);
      expect(report.importResolutionPassed).toBe(true);
      expect(report.diagnostics).toHaveLength(0);

      // Now atomic commit merges into real VFS
      const commit = ShadowSandboxService.commitStagedChanges(session.sessionId, vfs);
      expect(commit.success).toBe(true);
      expect(vfs.exists('src/services/consumer.ts')).toBe(true);
      expect(vfs.readFile('src/services/consumer.ts')).toContain('export const run');

      // Test instant rollback
      const rolledBack = ShadowSandboxService.rollbackCommit(commit.commitId, vfs);
      expect(rolledBack).toBe(true);
    });

    it('catches broken imports, syntax errors, and security gates in shadow sandbox', async () => {
      const session = ShadowSandboxService.createSession(vfs);
      ShadowSandboxService.stageMutations(session.sessionId, [
        {
          path: 'src/broken.ts',
          type: 'create',
          content: "import { nonExistent } from './missingModule';\nfunction bad() { {", // unbalanced braces
        },
        {
          path: '.env',
          type: 'modify',
          content: 'SECRET_API_KEY=exposed_secret',
        },
      ]);

      const report = await ShadowSandboxService.runAutoVerification(session.sessionId);
      expect(report.passed).toBe(false);
      expect(report.syntaxChecksPassed).toBe(false);
      expect(report.importResolutionPassed).toBe(false);

      const errTypes = report.diagnostics.map(d => d.type);
      expect(errTypes).toContain('syntax_error');
      expect(errTypes).toContain('broken_import');
      expect(errTypes).toContain('security_gate');

      // Attempt to commit unverified changes should be rejected
      const attempt = ShadowSandboxService.commitStagedChanges(session.sessionId, vfs);
      expect(attempt.success).toBe(false);
      expect(attempt.error).toContain('Cannot commit unverified changes');
    });
  });

  describe('5. Swarm Hierarchy & Cockpit Integration', () => {
    it('hierarchical service integrates cleanly with shadow sandbox and swarms', async () => {
      const hierarchyService = new AgentHierarchyService(vfs);
      const plan = hierarchyService.decomposeFeatureSlicingSwarm('Search Engine');

      expect(plan.tasks).toHaveLength(4);
      expect(plan.type).toBe('feature-slicing');

      const guardianStatus = hierarchyService.startBackgroundGuardians(100);
      expect(guardianStatus.isActive).toBe(true);
      hierarchyService.stopBackgroundGuardians();
    });
  });
});
