import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MODELS,
  createDefaultProviders,
  DEFAULT_ROLE_ASSIGNMENTS,
  DEFAULT_PRIVACY_SETTINGS,
} from '../defaultModelCatalog';

describe('Default Model Catalog & Provider Registry', () => {
  it('provides verified model definitions for primary AI providers', () => {
    expect(DEFAULT_MODELS.gemini).toBeDefined();
    expect(DEFAULT_MODELS.openai).toBeDefined();
    expect(DEFAULT_MODELS.anthropic).toBeDefined();
    expect(DEFAULT_MODELS.deepseek).toBeDefined();

    expect(DEFAULT_MODELS.gemini.length).toBeGreaterThan(0);
    const flashModel = DEFAULT_MODELS.gemini.find(m => m.id === 'gemini-3.8-flash');
    expect(flashModel).toBeDefined();
    expect(flashModel?.contextWindow).toBeGreaterThanOrEqual(1000000);
    expect(flashModel?.supportsToolCalling).toBe(true);
  });

  it('generates complete initial provider configurations with createDefaultProviders', () => {
    const providers = createDefaultProviders();
    expect(providers.length).toBeGreaterThanOrEqual(16);

    const gemini = providers.find(p => p.id === 'gemini');
    expect(gemini).toBeDefined();
    expect(gemini?.enabled).toBe(true);
    expect(gemini?.defaultModelId).toBe('gemini-3.8-flash');
    expect(gemini?.models.length).toBe(DEFAULT_MODELS.gemini.length);

    const openai = providers.find(p => p.id === 'openai');
    expect(openai).toBeDefined();
    expect(openai?.defaultModelId).toBe('gpt-4o');
  });

  it('provides comprehensive role-to-model assignments', () => {
    expect(DEFAULT_ROLE_ASSIGNMENTS.defaultChat).toEqual({ providerId: 'gemini', modelId: 'gemini-3.8-flash' });
    expect(DEFAULT_ROLE_ASSIGNMENTS.orchestrator).toEqual({ providerId: 'gemini', modelId: 'gemini-3.8-flash' });
    expect(DEFAULT_ROLE_ASSIGNMENTS.coding).toEqual({ providerId: 'gemini', modelId: 'gemini-3.8-flash' });
    expect(DEFAULT_ROLE_ASSIGNMENTS.architecture).toEqual({ providerId: 'gemini', modelId: 'gemini-2.5-pro' });
    expect(DEFAULT_ROLE_ASSIGNMENTS.testing).toEqual({ providerId: 'gemini', modelId: 'gemini-2.5-flash' });
  });

  it('provides secure default privacy and quota settings', () => {
    expect(DEFAULT_PRIVACY_SETTINGS.allowSendSourceCode).toBe(true);
    expect(DEFAULT_PRIVACY_SETTINGS.excludeEnvSecrets).toBe(true);
    expect(DEFAULT_PRIVACY_SETTINGS.excludeFolders).toContain('node_modules');
    expect(DEFAULT_PRIVACY_SETTINGS.excludeFolders).toContain('.git');
    expect(DEFAULT_PRIVACY_SETTINGS.maxCostPerSessionUsd).toBe(10.0);
    expect(DEFAULT_PRIVACY_SETTINGS.fallbackPolicy).toBe('same_provider');
  });
});
