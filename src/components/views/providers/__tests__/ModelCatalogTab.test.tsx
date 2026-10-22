import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModelCatalogTab } from '../ModelCatalogTab';
import { ModelInfo } from '../../../../types/aiProvider';

afterEach(cleanup);

describe('ModelCatalogTab Component', () => {
  const sampleModels: ModelInfo[] = [
    {
      id: 'claude-3-7-sonnet',
      providerId: 'anthropic',
      name: 'Claude 3.7 Sonnet',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      inputModalities: ['text', 'image'],
      outputModalities: ['text', 'code'],
      supportsToolCalling: true,
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      isReasoning: true,
      isCoding: true,
      status: 'verified',
      description: 'Hybrid reasoning and standard model',
    },
    {
      id: 'gpt-4o',
      providerId: 'openai',
      name: 'GPT-4o',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputModalities: ['text', 'image'],
      outputModalities: ['text', 'code'],
      supportsToolCalling: true,
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      isReasoning: false,
      isCoding: true,
      status: 'verified',
      description: 'Omni multi-modal model',
    },
  ];

  it('renders model cards with capability badges and context limits', () => {
    render(
      <ModelCatalogTab
        catalogQuery=""
        setCatalogQuery={vi.fn()}
        catalogProviderFilter="all"
        setCatalogProviderFilter={vi.fn()}
        catalogCapabilityFilter="all"
        setCatalogCapabilityFilter={vi.fn()}
        filteredModels={sampleModels}
        handleRefreshCatalog={vi.fn()}
        isRefreshingCatalog={false}
      />
    );

    expect(screen.getByText('Claude 3.7 Sonnet')).toBeDefined();
    expect(screen.getByText('GPT-4o')).toBeDefined();
    expect(screen.getAllByText('Tools').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reasoning').length).toBeGreaterThan(0);
    expect(screen.getByText('200k')).toBeDefined();
    expect(screen.getByText('128k')).toBeDefined();
  });

  it('handles search input and triggers refresh', () => {
    const setCatalogQuery = vi.fn();
    const handleRefresh = vi.fn();

    render(
      <ModelCatalogTab
        catalogQuery=""
        setCatalogQuery={setCatalogQuery}
        catalogProviderFilter="all"
        setCatalogProviderFilter={vi.fn()}
        catalogCapabilityFilter="all"
        setCatalogCapabilityFilter={vi.fn()}
        filteredModels={sampleModels}
        handleRefreshCatalog={handleRefresh}
        isRefreshingCatalog={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: 'claude' } });
    expect(setCatalogQuery).toHaveBeenCalledWith('claude');

    const refreshBtn = screen.getByRole('button', { name: /Refresh Catalog/i });
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();
  });
});
