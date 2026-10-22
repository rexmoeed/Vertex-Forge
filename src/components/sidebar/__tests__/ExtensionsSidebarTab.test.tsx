import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExtensionsSidebarTab } from '../ExtensionsSidebarTab';

afterEach(cleanup);

describe('ExtensionsSidebarTab Component', () => {
  it('renders extensions header and installed counter badge', () => {
    render(<ExtensionsSidebarTab />);
    expect(screen.getByText(/Extensions & Plugins/i)).toBeDefined();
    expect(screen.getAllByText(/Installed/i).length).toBeGreaterThan(0);
  });

  it('filters extensions based on search query', () => {
    render(<ExtensionsSidebarTab />);
    const searchInput = screen.getByPlaceholderText(/Search Extensions in Marketplace/i);
    expect(screen.getByText('TypeScript & JavaScript Features')).toBeDefined();

    fireEvent.change(searchInput, { target: { value: 'Docker' } });
    expect(screen.queryByText('TypeScript & JavaScript Features')).toBeNull();
    expect(screen.getByText('Docker & Containers')).toBeDefined();
  });

  it('filters extensions when clicking filter pills', () => {
    render(<ExtensionsSidebarTab />);
    const recommendedPill = screen.getByRole('button', { name: /^recommended$/i });
    fireEvent.click(recommendedPill);

    expect(screen.getByText('TypeScript & JavaScript Features')).toBeDefined();
    expect(screen.queryByText('Docker & Containers')).toBeNull();
  });

  it('toggles install state when clicking install button', () => {
    render(<ExtensionsSidebarTab />);
    const searchInput = screen.getByPlaceholderText(/Search Extensions in Marketplace/i);
    fireEvent.change(searchInput, { target: { value: 'Rust' } });

    const installBtn = screen.getByRole('button', { name: /^Install$/ });
    expect(installBtn).toBeDefined();

    fireEvent.click(installBtn);
    expect(screen.getByRole('button', { name: /^Uninstall$/i })).toBeDefined();
  });
});
