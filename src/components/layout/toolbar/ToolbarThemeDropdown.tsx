import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { THEME_REGISTRY } from '../../../services/themeRegistry';
import { Palette, Sparkles, Check, ChevronDown } from 'lucide-react';

export const ToolbarThemeDropdown: React.FC = () => {
  const themeEngine = useTheme();
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 text-xs font-medium transition-colors cursor-pointer shadow-xs"
        title="Switch IDE Color Theme"
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/20 dark:ring-white/20"
          style={{ backgroundColor: themeEngine.activeTheme.colors.accent }}
        />
        <span className="truncate max-w-[95px] font-medium">{themeEngine.activeTheme.name}</span>
        <ChevronDown className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
      </button>

      {isThemeDropdownOpen && (
        <div
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text)',
          }}
          className="absolute top-full right-0 mt-1 w-72 backdrop-blur-xl border rounded-xl shadow-2xl py-1.5 z-50 max-h-96 overflow-y-auto animate-fadeIn"
        >
          <div
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b"
            style={{ color: 'var(--ide-text-muted)', borderColor: 'var(--ide-border)' }}
          >
            <div className="flex items-center gap-1.5">
              <Palette className="w-3 h-3" style={{ color: 'var(--ide-accent)' }} />
              <span>Color Themes</span>
            </div>
            <span className="font-mono text-[9px]">{Object.keys(THEME_REGISTRY).length} Modes</span>
          </div>

          {/* 1. Antigravity Studio Themes */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Antigravity Studio Themes</span>
          </div>
          {[
            'antigravity',
            'antigravity-monochrome',
            'antigravity-cyber',
            'antigravity-nebula',
            'antigravity-solar',
            'antigravity-titanium',
            'antigravity-frost',
            'antigravity-studio',
          ].map(id => {
            const th = THEME_REGISTRY[id];
            if (!th) return null;
            const isSelected = themeEngine.themeId === th.id;
            return (
              <button
                key={th.id}
                onClick={() => {
                  themeEngine.setTheme(th.id);
                  setIsThemeDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="flex items-center -space-x-1 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                      style={{ backgroundColor: th.colors.bg }}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                      style={{ backgroundColor: th.colors.surfaceElevated }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shadow-xs z-10"
                      style={{ backgroundColor: th.colors.accent }}
                    />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="truncate font-medium">{th.name}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{th.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {th.category}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}

          {/* 2. Developer Classics */}
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Developer Classics
          </div>
          {[
            'monochrome',
            'dark',
            'one-dark',
            'dracula',
            'nord',
            'monokai',
            'solarized-dark',
            'solarized-light',
            'github-dark',
            'github-light',
            'light',
            'midnight',
            'abyss',
          ].map(id => {
            const th = THEME_REGISTRY[id];
            if (!th) return null;
            const isSelected = themeEngine.themeId === th.id;
            return (
              <button
                key={th.id}
                onClick={() => {
                  themeEngine.setTheme(th.id);
                  setIsThemeDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="flex items-center -space-x-1 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                      style={{ backgroundColor: th.colors.bg }}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                      style={{ backgroundColor: th.colors.surfaceElevated }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shadow-xs z-10"
                      style={{ backgroundColor: th.colors.accent }}
                    />
                  </div>
                  <span className="truncate font-medium">{th.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {th.category}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}

          {/* 3. Accessibility & High Contrast */}
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            High Contrast (WCAG AAA)
          </div>
          {['high-contrast-dark', 'high-contrast-light'].map(id => {
            const th = THEME_REGISTRY[id];
            if (!th) return null;
            const isSelected = themeEngine.themeId === th.id;
            return (
              <button
                key={th.id}
                onClick={() => {
                  themeEngine.setTheme(th.id);
                  setIsThemeDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="flex items-center -space-x-1 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-white/50"
                      style={{ backgroundColor: th.colors.bg }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-white/50 shadow-xs z-10"
                      style={{ backgroundColor: th.colors.accent }}
                    />
                  </div>
                  <span className="truncate font-medium">{th.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    AAA
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
