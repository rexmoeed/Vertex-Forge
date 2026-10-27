import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Palette,
  Sun,
  Moon,
  ChevronDown,
  Check,
} from 'lucide-react';
import { GlobalDesignEngine } from '../../services/designSystemEngine';
import { THEME_REGISTRY } from '../../services/themeRegistry';
import { DesignTokensTab } from './design/DesignTokensTab';
import { DesignComponentsTab } from './design/DesignComponentsTab';
import { DesignTypographyTab } from './design/DesignTypographyTab';
import { DesignAccessibilityTab } from './design/DesignAccessibilityTab';

export const DesignSystemView: React.FC = () => {
  const { setActiveView } = useIDE();
  const themeEngine = useTheme();
  const [activeTab, setActiveTab] = useState<'tokens' | 'components' | 'typography' | 'accessibility'>('tokens');
  const [themeFilter, setThemeFilter] = useState<'all' | 'dark' | 'light' | 'high-contrast'>('all');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const activeTheme = themeEngine.activeTheme;
  const allThemesList = Object.values(THEME_REGISTRY);

  // Filter themes based on selected category
  const filteredThemes = allThemesList.filter(t => {
    if (themeFilter === 'all') return true;
    if (themeFilter === 'dark') return t.category === 'dark' && !t.isHighContrast;
    if (themeFilter === 'light') return t.category === 'light' && !t.isHighContrast;
    if (themeFilter === 'high-contrast') return t.isHighContrast || t.category === 'high-contrast';
    return true;
  });

  // Dynamically synchronize design engine tokens with active theme
  GlobalDesignEngine.setTheme(themeEngine.isDark ? 'dark' : 'light');
  const themeConfig = GlobalDesignEngine.getTheme();
  const tokens = themeConfig.tokens;

  const contrastRatio = GlobalDesignEngine.calculateContrast(activeTheme.colors.text, activeTheme.colors.surface);

  const accentColorPresets = [
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Sky Blue', color: '#38bdf8' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Teal', color: '#14b8a6' },
  ];

  return (
    <div className="flex-1 w-full h-full min-h-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 flex flex-col gap-6 text-slate-900 dark:text-slate-100 select-none">
      {/* 1. HEADER WITH COLOR MODE DROPDOWN & VIEW SWITCHERS */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs dark:shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Vertex Forge Design System Engine</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                WCAG 2.1 AA Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-theme color modes, semantic tokens, typography scale, spacing constraints, and component state matrix.
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Active Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-colors cursor-pointer"
            >
              <div style={{ backgroundColor: activeTheme.colors.accent }} className="w-2.5 h-2.5 rounded-full shadow-xs" />
              <span>{activeTheme.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isThemeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-fadeIn">
                {allThemesList.map(t => {
                  const isCur = themeEngine.themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        themeEngine.setTheme(t.id);
                        setIsThemeDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between cursor-pointer transition ${
                        isCur
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div style={{ backgroundColor: t.colors.accent }} className="w-2 h-2 rounded-full shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {t.category}
                        </span>
                        {isCur && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View Tab Buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {(['tokens', 'components', 'typography', 'accessibility'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Sun/Moon Toggle */}
          <button
            onClick={() => themeEngine.setThemeMode(themeEngine.isDark ? 'light' : 'dark')}
            className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer transition-colors"
            title="Toggle Light / Dark Mode"
          >
            {themeEngine.isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => setActiveView('editor')}
            className="px-3 py-1.5 rounded-xl font-medium text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Return to Main Editor Workspace"
          >
            <span>←</span> Back to Editor
          </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'tokens' && (
        <DesignTokensTab
          activeTheme={activeTheme}
          allThemesList={allThemesList}
          themeFilter={themeFilter}
          setThemeFilter={setThemeFilter}
          filteredThemes={filteredThemes}
          themeEngine={themeEngine}
          tokens={tokens}
          accentColorPresets={accentColorPresets}
        />
      )}

      {activeTab === 'components' && (
        <DesignComponentsTab activeTheme={activeTheme} />
      )}

      {activeTab === 'typography' && (
        <DesignTypographyTab />
      )}

      {activeTab === 'accessibility' && (
        <DesignAccessibilityTab
          activeTheme={activeTheme}
          contrastRatio={contrastRatio}
        />
      )}
    </div>
  );
};
