import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalLLMService } from '../localLLMService';

describe('LocalLLMService (Offline AI & Local Models)', () => {
  beforeEach(() => {
    LocalLLMService.setActiveEndpoint('ollama');
    LocalLLMService.setPreferredModel('deepseek-coder-v2:latest');
    LocalLLMService.setPrivacyMode(false);
  });

  afterEach(() => {
    LocalLLMService.setFetchClient(undefined);
    vi.restoreAllMocks();
  });

  describe('Endpoint Configuration & State Management', () => {
    it('returns default configured endpoints', () => {
      const endpoints = LocalLLMService.getEndpoints();
      expect(endpoints.length).toBeGreaterThanOrEqual(2);
      expect(endpoints.some(e => e.id === 'ollama')).toBe(true);
      expect(endpoints.some(e => e.id === 'lmstudio')).toBe(true);
    });

    it('sets and gets active endpoint', () => {
      LocalLLMService.setActiveEndpoint('lmstudio');
      expect(LocalLLMService.getActiveEndpoint().id).toBe('lmstudio');

      LocalLLMService.setActiveEndpoint('ollama');
      expect(LocalLLMService.getActiveEndpoint().id).toBe('ollama');
    });

    it('ignores unknown endpoint IDs and retains active endpoint', () => {
      const current = LocalLLMService.getActiveEndpoint().id;
      LocalLLMService.setActiveEndpoint('unknown-hub');
      expect(LocalLLMService.getActiveEndpoint().id).toBe(current);
    });

    it('manages preferred model state', () => {
      LocalLLMService.setPreferredModel('qwen2.5-coder:32b');
      expect(LocalLLMService.getPreferredModel()).toBe('qwen2.5-coder:32b');
    });

    it('manages strict privacy mode state', () => {
      expect(LocalLLMService.isPrivacyMode()).toBe(false);
      LocalLLMService.setPrivacyMode(true);
      expect(LocalLLMService.isPrivacyMode()).toBe(true);
    });
  });

  describe('Healthcheck & Model Discovery', () => {
    it('successfully healthchecks Ollama and parses installed models', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            {
              name: 'deepseek-coder-v2:latest',
              size: 8900000000,
              details: {
                parameter_size: '16B',
                quantization_level: 'Q4_K_M',
              },
            },
            {
              name: 'llama3.3:latest',
              size: 45000000000,
              details: {
                parameter_size: '70B',
              },
            },
          ],
        }),
      });

      LocalLLMService.setFetchClient(mockFetch as any);
      const res = await LocalLLMService.checkEndpointHealth('ollama');

      expect(res.status).toBe('online');
      expect(res.availableModels.length).toBe(2);
      expect(res.availableModels[0].id).toBe('deepseek-coder-v2:latest');
      expect(res.availableModels[0].family).toBe('deepseek');
      expect(res.availableModels[0].isCodingSpecialist).toBe(true);
      expect(res.availableModels[1].family).toBe('llama');
      expect(res.availableModels[1].isCodingSpecialist).toBe(false);
    });

    it('successfully healthchecks LM Studio and parses OpenAI-compatible models', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'qwen2.5-coder-7b-instruct' },
            { id: 'deepseek-r1-distill-qwen-14b' },
          ],
        }),
      });

      LocalLLMService.setFetchClient(mockFetch as any);
      const res = await LocalLLMService.checkEndpointHealth('lmstudio');

      expect(res.status).toBe('online');
      expect(res.availableModels.length).toBe(2);
      expect(res.availableModels[0].family).toBe('qwen');
      expect(res.availableModels[0].isCodingSpecialist).toBe(true);
      expect(res.availableModels[1].family).toBe('deepseek');
    });

    it('marks endpoint offline when fetch request fails', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      LocalLLMService.setFetchClient(mockFetch as any);

      const res = await LocalLLMService.checkEndpointHealth('ollama');
      expect(res.status).toBe('offline');
      expect(res.latencyMs).toBe(-1);
      expect(res.availableModels).toEqual([]);
    });
  });

  describe('Chat Completion & Code Synthesis', () => {
    it('executes chat completion against Ollama with usage stats', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: { content: 'export const add = (a: number, b: number) => a + b;' },
          model: 'deepseek-coder-v2:latest',
          prompt_eval_count: 45,
          eval_count: 22,
        }),
      });

      LocalLLMService.setFetchClient(mockFetch as any);
      const res = await LocalLLMService.chatCompletion({
        messages: [{ role: 'user', content: 'Write an add function' }],
      });

      expect(res.content).toBe('export const add = (a: number, b: number) => a + b;');
      expect(res.model).toBe('deepseek-coder-v2:latest');
      expect(res.tokensEvaluated).toBe(45);
      expect(res.tokensGenerated).toBe(22);
      expect(res.isLocal).toBe(true);
    });

    it('executes chat completion against LM Studio OpenAI format', async () => {
      LocalLLMService.setActiveEndpoint('lmstudio');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: 'console.log("hello local AI");' },
            },
          ],
          model: 'qwen2.5-coder',
          usage: {
            prompt_tokens: 30,
            completion_tokens: 12,
          },
        }),
      });

      LocalLLMService.setFetchClient(mockFetch as any);
      const res = await LocalLLMService.chatCompletion({
        messages: [{ role: 'user', content: 'Say hello' }],
      });

      expect(res.content).toBe('console.log("hello local AI");');
      expect(res.tokensEvaluated).toBe(30);
      expect(res.tokensGenerated).toBe(12);
      expect(res.isLocal).toBe(true);
    });

    it('falls back to offline simulation response when provider request fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      LocalLLMService.setFetchClient(mockFetch as any);
      const res = await LocalLLMService.chatCompletion({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(res.isLocal).toBe(true);
      expect(res.model).toContain('fallback');
      expect(res.content).toContain('Vertex Forge Local AI Fallback');
    });

    it('generates a clean code snippet stripped of markdown fences', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: {
            content: '```typescript\nfunction square(n: number) { return n * n; }\n```',
          },
        }),
      });

      LocalLLMService.setFetchClient(mockFetch as any);
      const snippet = await LocalLLMService.generateCodeSnippet('implement square function');

      expect(snippet).toContain('function square(n: number)');
      expect(snippet).not.toContain('```typescript');
    });
  });

  describe('Concurrent Multi-Endpoint Auto-Detection', () => {
    it('probes all endpoints and counts online services', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('11434')) {
          return {
            ok: true,
            json: async () => ({
              models: [{ name: 'deepseek-coder-v2:latest', size: 1000 }],
            }),
          };
        }
        return {
          ok: false,
          status: 500,
        };
      });

      LocalLLMService.setFetchClient(mockFetch as any);
      const report = await LocalLLMService.autoDetectAllEndpoints();

      expect(report.onlineCount).toBe(1);
      expect(report.detectedModelsCount).toBe(1);
      expect(report.endpoints.length).toBeGreaterThanOrEqual(2);
    });
  });
});
