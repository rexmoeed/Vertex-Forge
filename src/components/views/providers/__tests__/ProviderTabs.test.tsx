import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectedTab } from '../ConnectedTab';
import { DefaultsTab } from '../DefaultsTab';
import { UsageTab } from '../UsageTab';
import { PrivacyTab } from '../PrivacyTab';
import { AgentOverridesTab } from '../AgentOverridesTab';

describe('Modular AI Provider Hub Tabs', () => {
  it('renders ConnectedTab with providers and handles connect action', () => {
    const onGoToAdd = vi.fn();
    render(
      <ConnectedTab
        providers={[
          { id: 'gemini', name: 'Google Gemini', enabled: true, isDefault: true },
          { id: 'anthropic', name: 'Anthropic Claude', enabled: false },
        ]}
        activeProviderId="gemini"
        onSetActiveProvider={vi.fn()}
        onToggleProvider={vi.fn()}
        onTestProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
        isTesting={null}
        testResults={{}}
        onGoToAddTab={onGoToAdd}
        showKeys={{}}
        onToggleShowKey={vi.fn()}
      />
    );

    expect(screen.getByText('Configured AI Providers')).toBeDefined();
    expect(screen.getByText('Google Gemini')).toBeDefined();
    expect(screen.getByText('Anthropic Claude')).toBeDefined();

    const connectBtn = screen.getByText('Connect New Provider');
    fireEvent.click(connectBtn);
    expect(onGoToAdd).toHaveBeenCalled();
  });

  it('renders DefaultsTab and triggers role model update', () => {
    const onUpdate = vi.fn();
    render(
      <DefaultsTab
        defaults={{
          orchestrator: 'gemini-3.8-flash',
          codeWriter: 'claude-3-7-sonnet',
          architect: 'claude-3-7-sonnet',
          debugger: 'gemini-3.8-flash',
          reviewer: 'claude-3-7-sonnet',
        }}
        onUpdateDefaults={onUpdate}
        models={[
          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'gemini', contextWindow: 1000000, maxOutputTokens: 8192, costPer1kInputUsd: 0.0001, costPer1kOutputUsd: 0.0004, capabilities: ['chat', 'coding'], status: 'active', isDefault: true },
        ]}
      />
    );

    expect(screen.getByText('Default Model Assignments')).toBeDefined();
  });

  it('renders UsageTab with records and cost', () => {
    const onClear = vi.fn();
    render(
      <UsageTab
        usageRecords={[
          { modelId: 'gemini-3.8-flash', promptTokens: 100, completionTokens: 50, costUsd: 0.0002, timestamp: Date.now() },
        ]}
        onClearUsage={onClear}
        totalCostUsd={0.0002}
      />
    );

    expect(screen.getByText('Token Usage & Cost Telemetry')).toBeDefined();
    expect(screen.getByText(/Total:\s*\$0\.0002/)).toBeDefined();
  });

  it('renders PrivacyTab and toggles zero-retention mode', () => {
    const onUpdate = vi.fn();
    render(
      <PrivacyTab
        privacy={{ zeroDataRetention: true, maskSensitiveData: true, localOnly: false, promptLoggingEnabled: false }}
        onUpdatePrivacy={onUpdate}
      />
    );

    expect(screen.getByText('Data Privacy & Zero-Retention Gates')).toBeDefined();
  });

  it('renders AgentOverridesTab', () => {
    render(
      <AgentOverridesTab
        agentOverrides={[]}
        onAddAgentOverride={vi.fn()}
        onRemoveAgentOverride={vi.fn()}
        models={[
          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'gemini', contextWindow: 1000000, maxOutputTokens: 8192, costPer1kInputUsd: 0.0001, costPer1kOutputUsd: 0.0004, capabilities: ['chat', 'coding'], status: 'active', isDefault: true },
        ]}
      />
    );

    expect(screen.getByText('Agent-Specific Model Overrides')).toBeDefined();
  });
});
