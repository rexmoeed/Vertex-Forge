import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AIProviderHubView } from '../AIProviderHubView';

afterEach(cleanup);

describe('AIProviderHubView Component', () => {
  it('renders hub header and switches between navigation tabs', () => {
    render(<AIProviderHubView />);

    expect(screen.getByText('AI Provider Hub')).toBeDefined();
    expect(screen.getByText('BYOK Ready')).toBeDefined();

    // Verify Tab buttons
    expect(screen.getByText('Connected Providers')).toBeDefined();
    expect(screen.getByText('Add Provider (BYOK)')).toBeDefined();
    expect(screen.getByText('Model Catalog')).toBeDefined();

    // Click Add Provider (BYOK) tab
    fireEvent.click(screen.getByText('Add Provider (BYOK)'));
    expect(screen.getByText('Add or Connect LLM Provider (BYOK)')).toBeDefined();

    // Click Model Catalog tab
    fireEvent.click(screen.getByText('Model Catalog'));
    expect(screen.getByText('Filter and inspect model capabilities (context size, reasoning, coding, vision, tool calling).')).toBeDefined();
  });
});
