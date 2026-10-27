import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProviderConnectionTester } from '../providerConnectionTester';
import { ProviderConfig } from '../../../types/aiProvider';

describe('ProviderConnectionTester', () => {
  const originalFetch = global.fetch;

  const createMockProvider = (overrides: Partial<ProviderConfig> = {}): ProviderConfig => ({
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Test Description',
    type: 'cloud',
    icon: 'gemini',
    enabled: true,
    authMethod: 'api_key',
    status: 'not_configured',
    isVerified: false,
    models: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns default models if fetchDynamicModels fails or returns empty', async () => {
    const updateSpy = vi.fn();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const defaults: any = [{ id: 'mock-1', name: 'Mock 1', contextWindow: 4000, description: 'Desc' }];
    const models = await ProviderConnectionTester.fetchDynamicModels(
      'gemini',
      undefined,
      defaults,
      updateSpy
    );

    expect(models).toEqual(defaults);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('updates provider when fetchDynamicModels returns valid models', async () => {
    const updateSpy = vi.fn();
    const fetchedModels: any = [{ id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 128000, description: 'Test' }];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, models: fetchedModels }),
    } as any);

    const provider = createMockProvider({ id: 'gemini' });

    const models = await ProviderConnectionTester.fetchDynamicModels(
      'gemini',
      provider,
      [],
      updateSpy
    );

    expect(models).toEqual(fetchedModels);
    expect(updateSpy).toHaveBeenCalledWith('gemini', { models: fetchedModels });
  });

  it('returns error if provider is undefined', async () => {
    const updateSpy = vi.fn();
    const result = await ProviderConnectionTester.testConnection(undefined, updateSpy);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Provider configuration not found');
  });

  it('returns error if api_key is missing for non-gemini provider', async () => {
    const updateSpy = vi.fn();
    const provider = createMockProvider({ id: 'openai', name: 'OpenAI' });

    const result = await ProviderConnectionTester.testConnection(provider, updateSpy);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing API key');
  });

  it('handles successful backend connection test', async () => {
    const updateSpy = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'All systems operational', latencyMs: 42 }),
    } as any);

    const provider = createMockProvider({
      id: 'openai',
      name: 'OpenAI',
      apiKey: 'sk-1234567890abcdef',
    });

    const result = await ProviderConnectionTester.testConnection(provider, updateSpy);
    expect(result.success).toBe(true);
    expect(result.latencyMs).toBe(42);
    expect(updateSpy).toHaveBeenCalledWith('openai', expect.objectContaining({
      status: 'connected',
      isVerified: true,
    }));
  });

  it('handles failed backend verification message', async () => {
    const updateSpy = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: 'Invalid API key credentials' }),
    } as any);

    const provider = createMockProvider({
      id: 'openai',
      name: 'OpenAI',
      apiKey: 'sk-invalid',
    });

    const result = await ProviderConnectionTester.testConnection(provider, updateSpy);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid API key credentials');
    expect(updateSpy).toHaveBeenCalledWith('openai', expect.objectContaining({
      status: 'error',
    }));
  });

  it('handles HTTP error status codes', async () => {
    const updateSpy = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Bad Gateway' }),
    } as any);

    const provider = createMockProvider({
      id: 'anthropic',
      name: 'Anthropic',
      apiKey: 'sk-ant-testkey',
    });

    const result = await ProviderConnectionTester.testConnection(provider, updateSpy);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Bad Gateway');
  });

  it('handles client-side fallback validation for OpenAI keys', async () => {
    const updateSpy = vi.fn();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const provider = createMockProvider({
      id: 'openai',
      name: 'OpenAI',
      apiKey: 'bad-key-format',
    });

    const result = await ProviderConnectionTester.testConnection(provider, updateSpy);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid OpenAI API key format');
  });

  it('handles client-side fallback validation for Anthropic keys', async () => {
    const updateSpy = vi.fn();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const provider = createMockProvider({
      id: 'anthropic',
      name: 'Anthropic',
      apiKey: 'not-ant-key',
    });

    const result = await ProviderConnectionTester.testConnection(provider, updateSpy);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid Anthropic API key format');
  });
});
