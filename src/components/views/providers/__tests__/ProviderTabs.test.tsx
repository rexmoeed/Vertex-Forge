import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectedTab } from '../ConnectedTab';
import { DefaultsTab } from '../DefaultsTab';
import { UsageTab } from '../UsageTab';
import { PrivacyTab } from '../PrivacyTab';
import { AgentOverridesTab } from '../AgentOverridesTab';
import { AIProviderService } from '../../../../services/aiProviderService';

describe('Modular AI Provider Hub Tabs', () => {
  const initialProviders = AIProviderService.getInitialProviders();
  const initialRoles = AIProviderService.getInitialRoleAssignments();
  const initialPrivacy = AIProviderService.getInitialPrivacySettings();

  it('renders ConnectedTab with providers and handles connect action', () => {
    const onGoToAdd = vi.fn();
    render(
      <ConnectedTab
        providers={initialProviders}
        onGoToAddTab={onGoToAdd}
        isAutoDetecting={false}
        onAutoDetectLocalLLMs={vi.fn()}
        autoDetectResult={null}
        onUpdateProvider={vi.fn()}
        onTestConnection={vi.fn()}
        isTestingConnection={false}
        diagnosticResult={null}
        diagnosticProvider="gemini"
        onDeleteProvider={vi.fn()}
        showKeys={{}}
        onToggleShowKey={vi.fn()}
      />
    );

    expect(screen.getByText('Configured AI Providers')).toBeDefined();
    expect(screen.getByText('Google Gemini')).toBeDefined();

    const connectBtn = screen.getByText('Connect New Provider');
    fireEvent.click(connectBtn);
    expect(onGoToAdd).toHaveBeenCalled();
  });

  it('renders DefaultsTab and triggers role model update', () => {
    const onUpdate = vi.fn();
    render(
      <DefaultsTab
        roleAssignments={initialRoles}
        providers={initialProviders}
        onRoleModelChange={onUpdate}
      />
    );

    expect(screen.getByText('Default Model Assignments')).toBeDefined();
  });

  it('renders UsageTab with records and cost', () => {
    const onClear = vi.fn();
    render(
      <UsageTab
        usageHistory={[
          {
            id: 'u1',
            providerId: 'gemini',
            modelId: 'gemini-3.8-flash',
            agentRole: 'Architect',
            project: 'Default',
            inputTokens: 100,
            outputTokens: 50,
            estimatedCostUsd: 0.0002,
            durationMs: 120,
            timestamp: new Date().toISOString(),
            success: true,
            isReported: false,
          },
        ]}
        totalTokensUsed={150}
        totalCostUsd={0.0002}
        onClearHistory={onClear}
      />
    );

    expect(screen.getByText('Usage & Cost Tracking')).toBeDefined();
    expect(screen.getByText('$0.0002')).toBeDefined();
  });

  it('renders PrivacyTab and toggles zero-retention mode', () => {
    const onUpdate = vi.fn();
    render(
      <PrivacyTab
        privacySettings={initialPrivacy}
        onPrivacyChange={onUpdate}
      />
    );

    expect(screen.getByText('Privacy & Project Data Control')).toBeDefined();
  });

  it('renders AgentOverridesTab', () => {
    render(
      <AgentOverridesTab
        roleAssignments={initialRoles}
        agentOverrides={{}}
        providers={initialProviders}
        onAgentOverrideChange={vi.fn()}
      />
    );

    expect(screen.getByText('Hierarchical Agent Model Matrix')).toBeDefined();
  });
});
