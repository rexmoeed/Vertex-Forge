import { ThemeDefinition } from '../../types/theme';
import { DARK_THEMES_CLASSIC } from './darkThemes.classic';
import { DARK_THEMES_MODERN } from './darkThemes.modern';

export const DARK_THEMES: Record<string, ThemeDefinition> = {
  ...DARK_THEMES_CLASSIC,
  ...DARK_THEMES_MODERN,
};
