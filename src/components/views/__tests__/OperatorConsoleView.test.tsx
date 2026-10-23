import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OperatorConsoleView } from '../OperatorConsoleView';

describe('OperatorConsoleView Component', () => {
  it('renders the console header and default Owner Approvals tab', () => {
    render(<OperatorConsoleView />);

    expect(screen.getByText('Operator Console')).toBeDefined();
    expect(screen.getAllByText('Owner Approvals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rulebook & Gates').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Credential Vault').length).toBeGreaterThan(0);
  });

  it('switches between governance tabs and renders tab contents', () => {
    render(<OperatorConsoleView />);

    // Click on Rulebook & Gates tab
    const rulebookTab = screen.getAllByRole('button', { name: /Rulebook & Gates/i })[0];
    fireEvent.click(rulebookTab);
    expect(screen.getByText('Rulebook Hard Gates')).toBeDefined();

    // Click on Credential Vault tab
    const vaultTab = screen.getAllByRole('button', { name: /Credential Vault/i })[0];
    fireEvent.click(vaultTab);
    expect(screen.getAllByText('Credential Vault').length).toBeGreaterThan(0);

    // Click on Model Router & LAN tab
    const routerTab = screen.getAllByRole('button', { name: /Model Router & LAN/i })[0];
    fireEvent.click(routerTab);
    expect(screen.getByText('Model Routing & LAN GPU Nodes')).toBeDefined();
  });

  it('renders business scope selector and changes scope', () => {
    render(<OperatorConsoleView />);

    const select = screen.getAllByRole('combobox')[0];
    expect(select).toBeDefined();
    fireEvent.change(select, { target: { value: 'biz-2' } });
    expect(select).toBeDefined();
  });
});
