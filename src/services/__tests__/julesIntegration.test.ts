import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIProviderService } from '../aiProviderService';
import { julesService, JulesService } from '../julesService';

describe('Google Jules Autonomous Cloud Agent Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('registers Jules in AIProviderService model catalog and provider list', () => {
    const providers = AIProviderService.loadProviders();
    const jules = providers.find((p) => p.id === 'jules');

    expect(jules).toBeDefined();
    expect(jules?.name).toBe('Google Jules');
    expect(jules?.baseUrl).toBe('https://jules.googleapis.com/v1alpha');
    expect(jules?.models.length).toBeGreaterThan(0);
    expect(jules?.models[0].id).toBe('jules-cloud-agent');
    expect(jules?.models[0].isCoding).toBe(true);
  });

  it('masks sensitive Jules API keys properly without exposure', () => {
    const rawKey = 'AQ.Ab8_MOCK_DUMMY_KEY_FOR_LOCAL_TESTING_ONLY_9999';
    const masked = AIProviderService.maskApiKey(rawKey);

    expect(masked).toBe('AQ.A••••••••••••9999');
    expect(masked).not.toContain('MOCK_DUMMY');
  });

  it('fetches connected sources via julesService.listSources', async () => {
    const mockSources = [
      {
        name: 'sources/github/rexmoeed/Vertex-Forge',
        id: 'github/rexmoeed/Vertex-Forge',
        githubRepo: {
          owner: 'rexmoeed',
          repo: 'Vertex-Forge',
          defaultBranch: { displayName: 'main' },
        },
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ sources: mockSources }),
    } as any);

    const sources = await julesService.listSources();
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe('github/rexmoeed/Vertex-Forge');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/jules/sources');
  });

  it('launches an autonomous coding session via julesService.createSession', async () => {
    const mockCreatedSession = {
      name: 'sessions/123456789',
      id: '123456789',
      title: 'Fix issue #42',
      prompt: 'Fix TypeScript lint errors',
      state: 'PLANNING',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockCreatedSession,
    } as any);

    const session = await julesService.createSession({
      prompt: 'Fix TypeScript lint errors',
      title: 'Fix issue #42',
      source: 'sources/github/rexmoeed/Vertex-Forge',
      startingBranch: 'main',
      requirePlanApproval: true,
    });

    expect(session.name).toBe('sessions/123456789');
    expect(session.state).toBe('PLANNING');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/jules/sessions',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('approves a generated execution plan via julesService.approvePlan', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'APPROVED' }),
    } as any);

    const success = await julesService.approvePlan('sessions/123456789');
    expect(success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/jules/sessions/123456789/approve',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
