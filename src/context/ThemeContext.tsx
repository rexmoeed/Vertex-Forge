import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeDefinition, ThemeMode, DensityMode, ThemePreferences } from '../types/theme';
import { THEME_REGISTRY, ThemeRegistryService } from '../services/themeRegistry';
import { logger } from '../services/logger';

interface ThemeContextType {
  activeTheme: ThemeDefinition;
  themeId: string;
  themeMode: ThemeMode;
  isDark: boolean;
  accentColor: string;
  density: DensityMode;
  reducedMotion: boolean;
  allThemes: ThemeDefinition[];
  setTheme: (themeId: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setDensity: (density: DensityMode) => void;
  setReducedMotion: (enabled: boolean) => void;
  resetAppearance: () => void;
}

const STORAGE_KEY = 'vertex_forge_theme_preferences_v2';

const DEFAULT_PREFERENCES: ThemePreferences = {
  themeId: 'antigravity',
  mode: 'dark',
  accentColor: '#00ff88',
  density: 'comfortable',
  reducedMotion: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
        };
      }
    } catch (e) {
      logger.warn('Failed to parse theme preferences', e);
    }
    return DEFAULT_PREFERENCES;
  });

  // 2. System theme preference detection
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // System reduced-motion preference detection
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches && !preferences.reducedMotion) {
      setPreferences(prev => ({ ...prev, reducedMotion: true }));
    }
    const handler = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    motionQuery.addEventListener('change', handler);
    return () => motionQuery.removeEventListener('change', handler);
  }, []);

  // 3. Resolve active ThemeDefinition based on themeId and mode
  const activeTheme = useMemo<ThemeDefinition>(() => {
    if (preferences.mode === 'system') {
      return systemIsDark ? THEME_REGISTRY['dark'] : THEME_REGISTRY['light'];
    }
    if (preferences.mode === 'high-contrast-dark') {
      return THEME_REGISTRY['high-contrast-dark'];
    }
    if (preferences.mode === 'high-contrast-light') {
      return THEME_REGISTRY['high-contrast-light'];
    }
    return THEME_REGISTRY[preferences.themeId] || THEME_REGISTRY['dark'];
  }, [preferences.themeId, preferences.mode, systemIsDark]);

  const isDark = activeTheme.category === 'dark' || activeTheme.id === 'high-contrast-dark';

  // 4. Synchronize CSS Custom Properties into :root on change
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const colors = activeTheme.colors;
    const effectiveAccent = preferences.accentColor || colors.accent;

    // Apply tokens
    root.style.setProperty('--ide-bg', colors.bg);
    root.style.setProperty('--ide-surface', colors.surface);
    root.style.setProperty('--ide-surface-elevated', colors.surfaceElevated);
    root.style.setProperty('--ide-border', colors.border);
    root.style.setProperty('--ide-border-muted', colors.borderMuted);
    root.style.setProperty('--ide-text', colors.text);
    root.style.setProperty('--ide-text-muted', colors.textMuted);
    root.style.setProperty('--ide-accent', effectiveAccent);
    root.style.setProperty('--ide-accent-hover', colors.accentHover);
    root.style.setProperty('--ide-selection', colors.selection);

    root.style.setProperty('--ide-editor-bg', colors.editorBg);
    root.style.setProperty('--ide-editor-gutter', colors.editorGutter);
    root.style.setProperty('--ide-editor-line-highlight', colors.editorLineHighlight);
    root.style.setProperty('--ide-sidebar-bg', colors.sidebarBg);
    root.style.setProperty('--ide-terminal-bg', colors.terminalBg);
    root.style.setProperty('--ide-terminal-text', colors.terminalText);

    // Scrollbar tokens
    root.style.setProperty('--ide-scrollbar-track', colors.scrollbarTrack);
    root.style.setProperty('--ide-scrollbar-thumb', colors.scrollbarThumb);
    root.style.setProperty('--ide-scrollbar-thumb-hover', colors.scrollbarThumbHover);
    root.style.setProperty('--ide-scrollbar-thumb-active', effectiveAccent);

    // Status colors
    root.style.setProperty('--ide-error', colors.error);
    root.style.setProperty('--ide-warning', colors.warning);
    root.style.setProperty('--ide-success', colors.success);
    root.style.setProperty('--ide-info', colors.info);

    // Density variables
    if (preferences.density === 'compact') {
      root.style.setProperty('--ide-row-height', '24px');
      root.style.setProperty('--ide-item-padding', '3px 6px');
      root.style.setProperty('--ide-font-size-base', '11px');
    } else if (preferences.density === 'spacious') {
      root.style.setProperty('--ide-row-height', '34px');
      root.style.setProperty('--ide-item-padding', '8px 12px');
      root.style.setProperty('--ide-font-size-base', '13px');
    } else {
      // comfortable
      root.style.setProperty('--ide-row-height', '28px');
      root.style.setProperty('--ide-item-padding', '5px 8px');
      root.style.setProperty('--ide-font-size-base', '12px');
    }

    // Class attributes
    root.setAttribute('data-theme', activeTheme.id);
    root.setAttribute('data-density', preferences.density);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    if (activeTheme.isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Persist preferences
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      logger.warn('Failed to save theme preferences', e);
    }
  }, [activeTheme, preferences, isDark]);

  // Handlers
  const setTheme = useCallback((newThemeId: string) => {
    const found = THEME_REGISTRY[newThemeId];
    if (found) {
      setPreferences(prev => ({
        ...prev,
        themeId: newThemeId,
        mode: found.isHighContrast
          ? found.category === 'dark' ? 'high-contrast-dark' : 'high-contrast-light'
          : found.category as ThemeMode,
      }));
    }
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setPreferences(prev => {
      let targetThemeId = prev.themeId;
      if (mode === 'light' && THEME_REGISTRY[prev.themeId]?.category !== 'light') {
        targetThemeId = 'light';
      } else if (mode === 'dark' && THEME_REGISTRY[prev.themeId]?.category !== 'dark') {
        targetThemeId = 'dark';
      } else if (mode === 'high-contrast-dark') {
        targetThemeId = 'high-contrast-dark';
      } else if (mode === 'high-contrast-light') {
        targetThemeId = 'high-contrast-light';
      }
      return {
        ...prev,
        mode,
        themeId: targetThemeId,
      };
    });
  }, []);

  const setAccentColor = useCallback((accentColor: string) => {
    setPreferences(prev => ({ ...prev, accentColor }));
  }, []);

  const setDensity = useCallback((density: DensityMode) => {
    setPreferences(prev => ({ ...prev, density }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setPreferences(prev => ({ ...prev, reducedMotion }));
  }, []);

  const resetAppearance = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        themeId: activeTheme.id,
        themeMode: preferences.mode,
        isDark,
        accentColor: preferences.accentColor,
        density: preferences.density,
        reducedMotion: preferences.reducedMotion,
        allThemes: ThemeRegistryService.getAllThemes(),
        setTheme,
        setThemeMode,
        setAccentColor,
        setDensity,
        setReducedMotion,
        resetAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

const DEFAULT_THEME_CONTEXT: ThemeContextType = {
  activeTheme: THEME_REGISTRY['dark'],
  themeId: 'dark',
  themeMode: 'dark',
  isDark: true,
  accentColor: '#6366f1',
  density: 'comfortable',
  reducedMotion: false,
  allThemes: ThemeRegistryService.getAllThemes(),
  setTheme: () => {},
  setThemeMode: () => {},
  setAccentColor: () => {},
  setDensity: () => {},
  setReducedMotion: () => {},
  resetAppearance: () => {},
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context || DEFAULT_THEME_CONTEXT;
};
