/**
 * Vertex Forge Theme System & Design Token Types
 * Architecture for runtime theme switching, system detection, and accessibility
 */

export type ThemeCategory = 'dark' | 'light' | 'high-contrast' | 'system';
export type ThemeMode = 'dark' | 'light' | 'system' | 'high-contrast-dark' | 'high-contrast-light';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';

export interface ThemeColors {
  // Global App Shell
  bg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderMuted: string;
  text: string;
  textMuted: string;

  // Accents & Selections
  accent: string;
  accentHover: string;
  selection: string;

  // Dedicated Component Backgrounds
  editorBg: string;
  editorGutter: string;
  editorLineHighlight: string;
  sidebarBg: string;
  terminalBg: string;
  terminalText: string;

  // Scrollbar Tokens
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  scrollbarThumbActive: string;

  // Semantic Status Tokens
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  isHighContrast?: boolean;
  colors: ThemeColors;
  monacoTheme: string;
}

export interface ThemePreferences {
  themeId: string;
  mode: ThemeMode;
  accentColor: string;
  density: DensityMode;
  reducedMotion: boolean;
}
