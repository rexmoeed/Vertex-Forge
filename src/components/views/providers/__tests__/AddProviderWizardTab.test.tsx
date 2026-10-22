import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddProviderWizardTab } from '../AddProviderWizardTab';

describe('AddProviderWizardTab Component', () => {
  const defaultProps = {
    wizardStep: 1 as const,
    setWizardStep: vi.fn(),
    selectedProviderToAdd: 'anthropic' as const,
    setSelectedProviderToAdd: vi.fn(),
    apiKeyInput: '',
    setApiKeyInput: vi.fn(),
    baseUrlInput: '',
    setBaseUrlInput: vi.fn(),
    showKeyPlaintext: false,
    setShowKeyPlaintext: vi.fn(),
    isTestingConnection: false,
    setIsTestingConnection: vi.fn(),
    wizardTestResult: null,
    setWizardTestResult: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders Step 1 with provider selection options and advances to step 2', () => {
    const setWizardStep = vi.fn();
    const setSelectedProviderToAdd = vi.fn();

    render(
      <AddProviderWizardTab
        {...defaultProps}
        wizardStep={1}
        setWizardStep={setWizardStep}
        setSelectedProviderToAdd={setSelectedProviderToAdd}
      />
    );

    expect(screen.getByText('Add or Connect LLM Provider (BYOK)')).toBeDefined();
    expect(screen.getByText('Anthropic Claude')).toBeDefined();
    expect(screen.getByText('OpenAI')).toBeDefined();

    const openAIOption = screen.getByText('OpenAI');
    fireEvent.click(openAIOption);
    expect(setSelectedProviderToAdd).toHaveBeenCalledWith('openai');

    const nextBtn = screen.getByRole('button', { name: /Continue to Credentials/i });
    fireEvent.click(nextBtn);
    expect(setWizardStep).toHaveBeenCalledWith(2);
  });

  it('renders Step 2 with API key input and password masking toggle', () => {
    const setShowKeyPlaintext = vi.fn();
    const setApiKeyInput = vi.fn();

    render(
      <AddProviderWizardTab
        {...defaultProps}
        wizardStep={2}
        apiKeyInput="sk-ant-test-12345"
        setShowKeyPlaintext={setShowKeyPlaintext}
        setApiKeyInput={setApiKeyInput}
      />
    );

    expect(screen.getByText(/API Key for ANTHROPIC/i)).toBeDefined();
    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    expect(input).toBeDefined();

    fireEvent.change(input, { target: { value: 'sk-ant-new-key' } });
    expect(setApiKeyInput).toHaveBeenCalledWith('sk-ant-new-key');
  });

  it('renders Step 4 and triggers onSave when activating provider', () => {
    const onSave = vi.fn();

    render(
      <AddProviderWizardTab
        {...defaultProps}
        wizardStep={4}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Ready to Activate Provider')).toBeDefined();
    const activateBtn = screen.getByRole('button', { name: /Activate Provider in Studio/i });
    fireEvent.click(activateBtn);
    expect(onSave).toHaveBeenCalled();
  });
});
