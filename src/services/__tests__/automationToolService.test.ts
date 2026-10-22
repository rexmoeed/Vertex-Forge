import { describe, it, expect, beforeEach } from 'vitest';
import { AutomationToolService } from '../automationToolService';

describe('AutomationToolService', () => {
  beforeEach(() => {
    AutomationToolService.toggleKillSwitch(false);
  });

  it('manages kill switch state', () => {
    expect(AutomationToolService.isKillSwitchEngaged()).toBe(false);
    AutomationToolService.toggleKillSwitch(true);
    expect(AutomationToolService.isKillSwitchEngaged()).toBe(true);
  });

  it('aborts browser actions when kill switch is engaged', async () => {
    AutomationToolService.toggleKillSwitch(true);
    const result = await AutomationToolService.executeBrowserAction('navigate', 'http://localhost:3000');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Kill-Switch is active');
  });

  it('allows navigation to allowed domains', async () => {
    const result = await AutomationToolService.executeBrowserAction('navigate', 'http://localhost:3000/app');
    expect(result.success).toBe(true);
    expect(result.data).toContain('headless browser sandbox');
  });

  it('blocks navigation to non-allowlisted domains', async () => {
    const result = await AutomationToolService.executeBrowserAction('navigate', 'https://malicious-site.example.com');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not on the secure domain allowlist');
  });

  it('simulates generic browser interaction actions', async () => {
    const clickResult = await AutomationToolService.executeBrowserAction('click', '#submit-button');
    expect(clickResult.success).toBe(true);
    expect(clickResult.data).toContain('Simulated browser action: click');

    const typeResult = await AutomationToolService.executeBrowserAction('type', 'input[name="query"]');
    expect(typeResult.success).toBe(true);
    expect(typeResult.data).toContain('Simulated browser action: type');
  });

  it('reports platform support status for android and ios', () => {
    const status = AutomationToolService.getMobilePlatformStatus();
    expect(status.android.status).toBe('supported');
    expect(status.ios).toBeDefined();
    expect(typeof status.ios.message).toBe('string');
  });
});
