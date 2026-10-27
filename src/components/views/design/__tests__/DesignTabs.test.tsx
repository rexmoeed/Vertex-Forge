import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DesignTypographyTab } from '../DesignTypographyTab';
import { DesignAccessibilityTab } from '../DesignAccessibilityTab';
import { DesignComponentsTab } from '../DesignComponentsTab';
import { DesignTokensTab } from '../DesignTokensTab';

describe('Design System Subcomponents', () => {
  const mockTheme: any = {
    id: 'obsidian',
    name: 'Obsidian Night',
    category: 'dark',
    colors: {
      accent: '#6366f1',
      bg: '#090a0f',
      surface: '#12141c',
      surfaceElevated: '#1a1d28',
      editorBg: '#0d0e15',
      terminalBg: '#07080b',
      border: '#232736',
      text: '#f1f5f9',
      textMuted: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f43f5e',
    },
  };

  it('renders typography scale', () => {
    render(<DesignTypographyTab />);
    expect(screen.getByText('Display / Hero (22px)')).toBeDefined();
    expect(screen.getByText('Autonomous AI Software Engineering Studio')).toBeDefined();
  });

  it('renders accessibility contrast ratios', () => {
    render(<DesignAccessibilityTab activeTheme={mockTheme} contrastRatio={12.4} />);
    expect(screen.getByText('12.4:1')).toBeDefined();
    expect(screen.getByText('AAA Pass')).toBeDefined();
  });

  it('renders components button state matrix', () => {
    render(<DesignComponentsTab activeTheme={mockTheme} />);
    expect(screen.getByText('Button Component State Matrix')).toBeDefined();
    expect(screen.getByText('Primary Action')).toBeDefined();
    expect(screen.getByText('Delete File')).toBeDefined();
  });

  it('renders tokens and triggers filter changes', () => {
    const setThemeFilter = vi.fn();
    const themeEngine: any = { themeId: 'obsidian', setTheme: vi.fn(), setAccentColor: vi.fn(), accentColor: '#6366f1' };

    render(
      <DesignTokensTab
        activeTheme={mockTheme}
        allThemesList={[mockTheme]}
        themeFilter="all"
        setThemeFilter={setThemeFilter}
        filteredThemes={[mockTheme]}
        themeEngine={themeEngine}
        tokens={{ spacing: { sm: '4px', md: '8px' } }}
        accentColorPresets={[{ name: 'Indigo', color: '#6366f1' }]}
      />
    );

    expect(screen.getByText('Color Modes & Theme Gallery')).toBeDefined();
    fireEvent.click(screen.getByText('☀️ Light (4)'));
    expect(setThemeFilter).toHaveBeenCalledWith('light');
  });
});
