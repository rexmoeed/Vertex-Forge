import { describe, it, expect, beforeEach } from 'vitest';
import { ProductionWatchdogService } from '../productionWatchdogService';

describe('ProductionWatchdogService', () => {
  let service: ProductionWatchdogService;

  beforeEach(() => {
    service = new ProductionWatchdogService();
    service.setConfig({
      providerType: 'sentry',
      endpoint: 'https://sentry.io/api',
      apiKeyCredentialId: 'cred-123',
      environment: 'production',
      readOnly: false,
      autoAnalyzeIncidents: true,
      redactSensitiveData: true,
    });
  });

  it('initializes with configuration and allows updates', () => {
    const config = service.getConfig();
    expect(config.providerType).toBe('sentry');
    expect(config.redactSensitiveData).toBe(true);

    service.setConfig({ autoAnalyzeIncidents: false });
    expect(service.getConfig().autoAnalyzeIncidents).toBe(false);
  });

  it('redacts sensitive credentials, tokens, and authorization headers from raw logs', () => {
    const raw = 'Request header: Bearer abc123def456 and api_key=secret_token_val cookie: session=xyz';
    const redacted = service.redactLogText(raw);

    expect(redacted).not.toContain('abc123def456');
    expect(redacted).not.toContain('secret_token_val');
    expect(redacted).not.toContain('session=xyz');
    expect(redacted).toContain('Bearer [REDACTED]');
    expect(redacted).toContain('[REDACTED]');
  });

  it('tests provider connection successfully with configured credentials', async () => {
    const result = await service.testProviderConnection();
    expect(result.success).toBe(true);
    expect(result.providerId).toBeDefined();
  });

  it('retrieves production incidents and details', async () => {
    const incidents = await service.getIncidents();
    expect(Array.isArray(incidents)).toBe(true);

    if (incidents.length > 0) {
      const inc = await service.getIncident(incidents[0].id);
      expect(inc).toBeDefined();
      expect(inc?.id).toBe(incidents[0].id);
    }
  });

  it('creates fix branch for active production incidents', async () => {
    const incidents = await service.getIncidents();
    if (incidents.length > 0) {
      const res = await service.createFixBranch(incidents[0].id);
      expect(res.success).toBe(true);
      expect(res.branchName).toContain('watchdog/fix/');
    }
  });

  it('throws error when creating fix branch for non-existent incident', async () => {
    await expect(service.createFixBranch('nonexistent-incident-id')).rejects.toThrow('Incident not found');
  });
});
