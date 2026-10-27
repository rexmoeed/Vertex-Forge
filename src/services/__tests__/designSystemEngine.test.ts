import { describe, it, expect, beforeEach } from 'vitest';
import { DesignSystemEngine, DEFAULT_DARK_TOKENS, DEFAULT_LIGHT_TOKENS } from '../designSystemEngine';

describe('DesignSystemEngine', () => {
  let engine: DesignSystemEngine;

  beforeEach(() => {
    engine = new DesignSystemEngine();
  });

  it('initializes with default Obsidian Studio Dark theme', () => {
    const theme = engine.getTheme();
    expect(theme.id).toBe('dark');
    expect(theme.name).toBe('Obsidian Studio Dark');
    expect(theme.tokens.colors.primary).toBe(DEFAULT_DARK_TOKENS.colors.primary);
    expect(theme.density).toBe('normal');
    expect(theme.accentColor).toBe('#6366f1');
  });

  it('switches to light theme with Pristine tokens', () => {
    engine.setTheme('light');
    const theme = engine.getTheme();
    expect(theme.id).toBe('light');
    expect(theme.name).toBe('Pristine Studio Light');
    expect(theme.tokens.colors.surface).toBe(DEFAULT_LIGHT_TOKENS.colors.surface);
  });

  it('switches back to dark theme cleanly', () => {
    engine.setTheme('light');
    engine.setTheme('dark');
    const theme = engine.getTheme();
    expect(theme.id).toBe('dark');
    expect(theme.tokens.colors.surface).toBe(DEFAULT_DARK_TOKENS.colors.surface);
  });

  it('updates density and accent color correctly', () => {
    engine.setDensity('compact');
    engine.setAccentColor('#10b981');
    const theme = engine.getTheme();
    expect(theme.density).toBe('compact');
    expect(theme.accentColor).toBe('#10b981');
  });
});
