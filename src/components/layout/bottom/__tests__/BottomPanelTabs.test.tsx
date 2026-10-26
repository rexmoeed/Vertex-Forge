import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProblemsTab } from '../ProblemsTab';
import { AuditTrailTab } from '../AuditTrailTab';
import { IDEProvider } from '../../../../context/IDEContext';

describe('Modular BottomPanel Tabs', () => {
  it('renders ProblemsTab empty state cleanly', () => {
    render(
      <IDEProvider>
        <ProblemsTab />
      </IDEProvider>
    );

    expect(screen.getByText('Problems & Diagnostics')).toBeDefined();
    expect(screen.getByText(/No problems found in workspace/)).toBeDefined();
  });

  it('renders AuditTrailTab compliance state cleanly', () => {
    render(
      <IDEProvider>
        <AuditTrailTab />
      </IDEProvider>
    );

    expect(screen.getByText('Governance & Code Audit Trail')).toBeDefined();
    expect(screen.getByText(/Full compliance governance active/)).toBeDefined();
  });
});
