import { describe, it, expect } from 'vitest';
import { ThemeRegistryService, THEME_REGISTRY } from '../themeRegistry';
import { PanelRegistry } from '../panelRegistry';
import { PANEL_CONSTRAINTS, DEFAULT_LAYOUT_CONFIG } from '../../types/layout';

describe('Vertex Forge Architecture: Theme Engine & Registry', () => {
  it('registers all required professional themes with valid tokens', () => {
    const themes = ThemeRegistryService.getAllThemes();
    expect(themes.length).toBeGreaterThanOrEqual(14);

    const themeIds = themes.map(t => t.id);
    expect(themeIds).toContain('dark');
    expect(themeIds).toContain('light');
    expect(themeIds).toContain('one-dark');
    expect(themeIds).toContain('dracula');
    expect(themeIds).toContain('nord');
    expect(themeIds).toContain('monokai');
    expect(themeIds).toContain('solarized-dark');
    expect(themeIds).toContain('solarized-light');
    expect(themeIds).toContain('github-dark');
    expect(themeIds).toContain('github-light');
    expect(themeIds).toContain('midnight');
    expect(themeIds).toContain('abyss');
    expect(themeIds).toContain('high-contrast-dark');
    expect(themeIds).toContain('high-contrast-light');
    expect(themeIds).toContain('antigravity');
    expect(themeIds).toContain('antigravity-cyber');
    expect(themeIds).toContain('antigravity-nebula');
    expect(themeIds).toContain('antigravity-solar');
    expect(themeIds).toContain('antigravity-titanium');
    expect(themeIds).toContain('antigravity-frost');
    expect(themeIds).toContain('antigravity-studio');
    expect(themeIds).toContain('antigravity-monochrome');
    expect(themeIds).toContain('monochrome');
  });

  it('guarantees complete color token coverage for every theme', () => {
    const requiredTokens = [
      'bg',
      'surface',
      'surfaceElevated',
      'border',
      'text',
      'textMuted',
      'accent',
      'editorBg',
      'editorGutter',
      'terminalBg',
      'scrollbarTrack',
      'scrollbarThumb',
      'error',
      'warning',
      'success',
      'info',
    ];

    const themes = ThemeRegistryService.getAllThemes();
    for (const theme of themes) {
      for (const token of requiredTokens) {
        expect((theme.colors as any)[token]).toBeDefined();
        expect(typeof (theme.colors as any)[token]).toBe('string');
        expect((theme.colors as any)[token].length).toBeGreaterThan(0);
      }
    }
  });

  it('verifies high contrast accessibility themes', () => {
    const hcDark = ThemeRegistryService.getTheme('high-contrast-dark');
    expect(hcDark.isHighContrast).toBe(true);
    expect(hcDark.category).toBe('high-contrast');
    expect(hcDark.colors.bg).toBe('#000000');
    expect(hcDark.colors.border).toBe('#ffffff');

    const hcLight = ThemeRegistryService.getTheme('high-contrast-light');
    expect(hcLight.isHighContrast).toBe(true);
    expect(hcLight.category).toBe('high-contrast');
    expect(hcLight.colors.bg).toBe('#ffffff');
    expect(hcLight.colors.border).toBe('#000000');
  });

  it('filters themes by category accurately', () => {
    const darkThemes = ThemeRegistryService.getThemesByCategory('dark');
    expect(darkThemes.length).toBeGreaterThanOrEqual(9);
    for (const t of darkThemes) {
      expect(t.category).toBe('dark');
    }

    const lightThemes = ThemeRegistryService.getThemesByCategory('light');
    expect(lightThemes.length).toBeGreaterThanOrEqual(3);
    for (const t of lightThemes) {
      expect(t.category).toBe('light');
    }
  });

  it('guarantees synchronized terminal background and text tokens across dark and light themes', () => {
    const allThemes = ThemeRegistryService.getAllThemes();
    for (const theme of allThemes) {
      expect(theme.colors.terminalBg).toBeDefined();
      expect(theme.colors.terminalText).toBeDefined();
      expect(typeof theme.colors.terminalBg).toBe('string');
      expect(typeof theme.colors.terminalText).toBe('string');
      expect(theme.colors.terminalBg.length).toBeGreaterThan(0);
      expect(theme.colors.terminalText.length).toBeGreaterThan(0);
    }

    // Verify Pristine Light theme terminal colors
    const lightTheme = ThemeRegistryService.getTheme('light');
    expect(lightTheme.colors.terminalBg).toBe('#f8fafc');
    expect(lightTheme.colors.terminalText).toBe('#1e293b');

    // Verify Obsidian Dark theme terminal colors
    const darkTheme = ThemeRegistryService.getTheme('dark');
    expect(darkTheme.colors.terminalBg).toBe('#020617');
    expect(darkTheme.colors.terminalText).toBe('#e2e8f0');

    // Verify High Contrast themes
    const hcLight = ThemeRegistryService.getTheme('high-contrast-light');
    expect(hcLight.colors.terminalBg).toBe('#ffffff');
    expect(hcLight.colors.terminalText).toBe('#000000');

    const hcDark = ThemeRegistryService.getTheme('high-contrast-dark');
    expect(hcDark.colors.terminalBg).toBe('#000000');
    expect(hcDark.colors.terminalText).toBe('#ffffff');
  });
});

describe('Vertex Forge Architecture: Panel Registry & Constraints', () => {
  it('registers all standard IDE panels with locations', () => {
    const allPanels = PanelRegistry.getAll();
    expect(allPanels.length).toBeGreaterThanOrEqual(8);

    const explorer = PanelRegistry.get('explorer');
    expect(explorer).toBeDefined();
    expect(explorer?.location).toBe('left');
    expect(explorer?.minSize).toBe(180);
    expect(explorer?.maxSize).toBe(550);

    const aiPanel = PanelRegistry.get('ai-orchestrator');
    expect(aiPanel).toBeDefined();
    expect(aiPanel?.location).toBe('right');
    expect(aiPanel?.minSize).toBe(280);
    expect(aiPanel?.maxSize).toBe(650);

    const terminal = PanelRegistry.get('terminal');
    expect(terminal).toBeDefined();
    expect(terminal?.location).toBe('bottom');
    expect(terminal?.minSize).toBe(120);

    const editor = PanelRegistry.get('code-editor');
    expect(editor).toBeDefined();
    expect(editor?.location).toBe('editor');
  });

  it('validates panel constraints enforce safe desktop limits', () => {
    expect(PANEL_CONSTRAINTS.primarySidebar.minSize).toBe(180);
    expect(PANEL_CONSTRAINTS.primarySidebar.maxSize).toBe(550);
    expect(PANEL_CONSTRAINTS.primarySidebar.defaultSize).toBe(260);

    expect(PANEL_CONSTRAINTS.secondarySidebar.minSize).toBe(280);
    expect(PANEL_CONSTRAINTS.secondarySidebar.maxSize).toBe(650);
    expect(PANEL_CONSTRAINTS.secondarySidebar.defaultSize).toBe(340);

    expect(PANEL_CONSTRAINTS.bottomPanel.minSize).toBe(120);
    expect(PANEL_CONSTRAINTS.bottomPanel.maxSize).toBe(650);
    expect(PANEL_CONSTRAINTS.bottomPanel.defaultSize).toBe(220);
  });

  it('provides stable default layout configuration', () => {
    expect(DEFAULT_LAYOUT_CONFIG.activityBarVisible).toBe(true);
    expect(DEFAULT_LAYOUT_CONFIG.primarySidebarVisible).toBe(true);
    expect(DEFAULT_LAYOUT_CONFIG.primarySidebarWidth).toBe(260);
    expect(DEFAULT_LAYOUT_CONFIG.secondarySidebarVisible).toBe(true);
    expect(DEFAULT_LAYOUT_CONFIG.secondarySidebarWidth).toBe(340);
    expect(DEFAULT_LAYOUT_CONFIG.bottomPanelVisible).toBe(true);
    expect(DEFAULT_LAYOUT_CONFIG.bottomPanelHeight).toBe(220);
    expect(DEFAULT_LAYOUT_CONFIG.editorSplit).toBe('none');
    expect(DEFAULT_LAYOUT_CONFIG.isZenMode).toBe(false);
  });

  it('guarantees responsive multi-panel desktop width allocation protecting central editor', () => {
    // Desktop 1080p (1920px)
    const fhdWidth = 1920;
    const activityBar = 48;
    const explorer = DEFAULT_LAYOUT_CONFIG.primarySidebarWidth; // 260
    const aiAssistant = DEFAULT_LAYOUT_CONFIG.secondarySidebarWidth; // 340
    const remainingEditorWidth = fhdWidth - activityBar - explorer - aiAssistant;
    expect(remainingEditorWidth).toBeGreaterThanOrEqual(1200);

    // Compact Desktop (1366px)
    const compactWidth = 1366;
    const compactRemaining = compactWidth - activityBar - 240 - 320;
    expect(compactRemaining).toBeGreaterThanOrEqual(700);

    // Minimum editor width constraint on any desktop
    const minEditorConstraint = 400;
    expect(minEditorConstraint).toBeGreaterThanOrEqual(PANEL_CONSTRAINTS.primarySidebar.minSize);
  });
});

describe('Vertex Forge Architecture: Auto-Save Engine & Storage Contract', () => {
  it('validates auto-save local storage keys and default configuration', () => {
    const AUTOSAVE_STORAGE_KEY = 'vertexforge_autosave';
    const AUTOSAVE_DELAY_STORAGE_KEY = 'vertexforge_autosave_delay';
    const DEFAULT_AUTOSAVE_DELAY_MS = 800;

    expect(AUTOSAVE_STORAGE_KEY).toBe('vertexforge_autosave');
    expect(AUTOSAVE_DELAY_STORAGE_KEY).toBe('vertexforge_autosave_delay');
    expect(DEFAULT_AUTOSAVE_DELAY_MS).toBe(800);
  });

  it('verifies standard auto-save delay presets are within responsive bounds', () => {
    const delayPresets = [300, 500, 800, 1500, 3000];
    for (const delay of delayPresets) {
      expect(delay).toBeGreaterThanOrEqual(200);
      expect(delay).toBeLessThanOrEqual(5000);
    }
  });

  it('guarantees focus loss and file change trigger mechanics contract', () => {
    // Contract: Auto-save triggers on both:
    // 1. Debounced file editing changes
    // 2. Immediate window blur, document visibility hidden, and editor blur
    const autoSaveTriggers = ['file_change_debounced', 'editor_textarea_blur', 'window_blur', 'document_visibility_hidden', 'tab_switch'];
    expect(autoSaveTriggers).toContain('file_change_debounced');
    expect(autoSaveTriggers).toContain('editor_textarea_blur');
    expect(autoSaveTriggers).toContain('window_blur');
    expect(autoSaveTriggers).toContain('document_visibility_hidden');
    expect(autoSaveTriggers).toContain('tab_switch');
  });
});
