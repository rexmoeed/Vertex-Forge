import { ThemeDefinition } from '../types/theme';
import { DARK_THEMES } from './themes/darkThemes';
import { LIGHT_THEMES } from './themes/lightThemes';
import { CONTRAST_THEMES } from './themes/contrastThemes';

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  ...DARK_THEMES,
  ...LIGHT_THEMES,
  ...CONTRAST_THEMES,
};

export class ThemeRegistryService {
  public static getAllThemes(): ThemeDefinition[] {
    return Object.values(THEME_REGISTRY);
  }

  public static getTheme(id: string): ThemeDefinition {
    return THEME_REGISTRY[id] || THEME_REGISTRY['dark'];
  }

  public static getThemesByCategory(category: string): ThemeDefinition[] {
    return Object.values(THEME_REGISTRY).filter(t => t.category === category);
  }
}

export default ThemeRegistryService;
