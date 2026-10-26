import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectedTab } from '../ConnectedTab';
import { AIProviderConfig } from '../../../../types';

describe('ConnectedTab Security & Sanitization', () => {
  const mockProviders: AIProviderConfig[] = [
    {
      id: 'p-1',
      name: 'Google Gemini',
      provider: 'google',
      type: 'cloud',
      endpoint: 'https://generativelanguage.googleapis.com',
      apiKey: 'secret-gemini-key-12345',
      models: [],
      status: 'active',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-2',
      name: 'Ollama Local',
      provider: 'ollama',
      type: 'local',
      endpoint: 'http://localhost:11434',
      models: [],
      status: 'active',
      isDefault: false,
      createdAt: new Date().toISOString(),
    },
  ];

  it('renders configured providers without leaking raw secret keys in the DOM', () => {
    const onToggleShowKey = vi.fn();
    const { container } = render(
      <ConnectedTab
        providers={mockProviders}
        showKeys={{}}
        onToggleShowKey={onToggleShowKey}
        onRemoveProvider={vi.fn()}
        onSetDefault={vi.fn()}
        onEditProvider={vi.fn()}
        onOpenAddModal={vi.fn()}
      />
    );

    expect(screen.getByText('Google Gemini')).toBeDefined();
    expect(screen.getByText('Ollama Local')).toBeDefined();
    // Verify that the secret key string is NOT exposed in the DOM
    expect(container.textContent).not.toContain('secret-gemini-key-12345');
    // Verify masked bullets are shown
    expect(screen.getByText('••••••••••••••••')).toBeDefined();
  });

  it('masks sensitive key and does not render raw secret even when show key is toggled', () => {
    const { container } = render(
      <ConnectedTab
        providers={mockProviders}
        showKeys={{ 'p-1': true }}
        onToggleShowKey={vi.fn()}
        onRemoveProvider={vi.fn()}
        onSetDefault={vi.fn()}
        onEditProvider={vi.fn()}
        onOpenAddModal={vi.fn()}
      />
    );

    // Raw key should remain unrendered in DOM for security hygiene
    expect(container.textContent).not.toContain('secret-gemini-key-12345');
    expect(screen.getByText('Configured & Active (Masked for Security)')).toBeDefined();
  });
});
