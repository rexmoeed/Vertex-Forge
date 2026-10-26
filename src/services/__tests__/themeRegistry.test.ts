import { describe, it, expect } from 'vitest';
import { THEME_REGISTRY } from '../themeRegistry';

describe('ThemeRegistry Engine & Color Contracts', () => {
  it('registers all required default themes', () => {
    expect(THEME_REGISTRY.dark).toBeDefined();
    expect(THEME_REGISTRY.light).toBeDefined();
    expect(THEME_REGISTRY.nord).toBeDefined();
    expect(THEME_REGISTRY.dracula).toBeDefined();
    expect(THEME_REGISTRY['high-contrast-dark']).toBeDefined();
    expect(THEME_REGISTRY['high-contrast-light']).toBeDefined();
  });

  it('enforces complete color token contracts on all registered themes', () => {
    const requiredColorTokens = [
      'bg', 'surface', 'surfaceElevated', 'border', 'borderMuted',
      'text', 'textMuted', 'accent', 'accentHover', 'selection',
      'editorBg', 'editorGutter', 'editorLineHighlight', 'sidebarBg',
      'terminalBg', 'terminalText', 'error', 'warning', 'success', 'info',
    ];

    for (const [themeId, theme] of Object.entries(THEME_REGISTRY)) {
      expect(theme.id).toBe(themeId);
      expect(theme.name).toBeDefined();
      expect(theme.monacoTheme).toBeDefined();

      for (const token of requiredColorTokens) {
        expect(theme.colors[token as keyof typeof theme.colors], `Theme ${themeId} missing token ${token}`).toBeDefined();
      }
    }
  });

  it('correctly tags high-contrast WCAG AAA accessibility themes', () => {
    const hcDark = THEME_REGISTRY['high-contrast-dark'];
    expect(hcDark.category).toBe('high-contrast');
    expect(hcDark.isHighContrast).toBe(true);

    const hcLight = THEME_REGISTRY['high-contrast-light'];
    expect(hcLight.category).toBe('high-contrast');
    expect(hcLight.isHighContrast).toBe(true);
  });
});
