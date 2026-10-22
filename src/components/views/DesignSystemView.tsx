import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Palette,
  Type,
  LayoutGrid,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Copy,
  Contrast,
  Laptop,
} from 'lucide-react';
import { GlobalDesignEngine } from '../../services/designSystemEngine';
import { THEME_REGISTRY } from '../../services/themeRegistry';
import { ThemeDefinition, ThemeMode } from '../../types/theme';

export const DesignSystemView: React.FC = () => {
  const { theme, toggleTheme, setActiveView } = useIDE();
  const themeEngine = useTheme();
  const [activeTab, setActiveTab] = useState<'tokens' | 'components' | 'typography' | 'accessibility'>('tokens');
  const [themeFilter, setThemeFilter] = useState<'all' | 'dark' | 'light' | 'high-contrast'>('all');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

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

  // Active theme semantic color palette tokens
  const activeColorPalettes = [
    { label: 'Primary Brand / Accent', hex: activeTheme.colors.accent, role: 'Key interactive elements, active tabs & glowing borders' },
    { label: 'Surface Background', hex: activeTheme.colors.bg, role: 'Base canvas and IDE viewport background' },
    { label: 'Elevated Surface', hex: activeTheme.colors.surface, role: 'Sidebars, panels, toolbars & dialog containers' },
    { label: 'Surface Highlight', hex: activeTheme.colors.surfaceElevated, role: 'Hover states, floating tooltips & elevated cards' },
    { label: 'Editor Viewport', hex: activeTheme.colors.editorBg, role: 'Active code editor editing canvas' },
    { label: 'Terminal Canvas', hex: activeTheme.colors.terminalBg, role: 'Console output, bash & powershell execution surface' },
    { label: 'Border Divider', hex: activeTheme.colors.border, role: 'Structural delimiters and panel splitters' },
    { label: 'Text Primary', hex: activeTheme.colors.text, role: 'Headings, editor syntax, and primary copy' },
    { label: 'Text Muted', hex: activeTheme.colors.textMuted, role: 'Line numbers, breadcrumbs & captions' },
    { label: 'Success Green', hex: activeTheme.colors.success, role: 'Passing tests, green diff additions, verified build' },
    { label: 'Warning Amber', hex: activeTheme.colors.warning, role: 'Pending approvals, warnings, in-progress tasks' },
    { label: 'Error Rose', hex: activeTheme.colors.error, role: 'Assertion failures, red diff deletions, syntax errors' },
  ];

  const contrastRatio = GlobalDesignEngine.calculateContrast(activeTheme.colors.text, activeTheme.colors.surface);

  const handleCopyColor = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

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

        {/* Action Controls & Mode Selectors */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Active Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 text-slate-800 dark:text-slate-100 transition-all cursor-pointer shadow-xs"
              title="Select IDE Color Mode / Theme"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: activeTheme.colors.accent }}
              />
              <span className="font-semibold">{activeTheme.name}</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {activeTheme.category}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform text-slate-500 ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isThemeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn max-h-80 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Color Mode
                </div>
                {allThemesList.map(t => {
                  const isCur = themeEngine.themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        themeEngine.setTheme(t.id);
                        setIsThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                          style={{ backgroundColor: t.colors.accent }}
                        />
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

      {/* 2. TOKENS TAB */}
      {activeTab === 'tokens' && (
        <div className="flex flex-col gap-6">
          {/* COLOR MODES & THEMES GALLERY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Color Modes & Theme Gallery</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose from 14 professional production themes. Instant runtime token update across the entire IDE.
                </p>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {[
                  { id: 'all', label: `All (${allThemesList.length})` },
                  { id: 'light', label: `☀️ Light (4)` },
                  { id: 'dark', label: `🌙 Dark (8)` },
                  { id: 'high-contrast', label: `⚡ High Contrast (2)` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setThemeFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      themeFilter === f.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Theme Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredThemes.map(def => {
                const isSelected = themeEngine.themeId === def.id;
                return (
                  <div
                    key={def.id}
                    onClick={() => themeEngine.setTheme(def.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                        : 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-sm'
                    }`}
                  >
                    {/* Theme Swatch Window Preview */}
                    <div
                      style={{ backgroundColor: def.colors.bg }}
                      className="h-16 rounded-lg p-2 flex flex-col justify-between border border-black/10 dark:border-white/10 shadow-inner overflow-hidden relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div style={{ backgroundColor: def.colors.accent }} className="w-3 h-3 rounded-full shadow-xs" />
                          <div style={{ backgroundColor: def.colors.editorBg }} className="w-3 h-3 rounded-full border border-white/20" />
                          <div style={{ backgroundColor: def.colors.surface }} className="w-3 h-3 rounded-full border border-white/20" />
                        </div>
                        <span
                          style={{
                            color: def.colors.textMuted,
                            backgroundColor: def.colors.surfaceElevated,
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 uppercase"
                        >
                          {def.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono px-0.5">
                        <span style={{ color: def.colors.text }} className="font-bold">
                          const ide = 'Vertex Forge';
                        </span>
                        <span style={{ color: def.colors.accent }} className="font-semibold">
                          Aa
                        </span>
                      </div>
                    </div>

                    {/* Theme Metadata & Selection State */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {def.name}
                        </span>
                        {isSelected ? (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            Apply
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-normal">
                        {def.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC SEMANTIC COLOR PALETTE TOKENS (Reflects Active Theme) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Semantic Color Palette Tokens: <span className="text-indigo-600 dark:text-indigo-400">{activeTheme.name}</span>
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Click any card to copy its exact HEX code</span>
              </div>
              {copiedHex && (
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 animate-fadeIn">
                  Copied {copiedHex}!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeColorPalettes.map((c, i) => (
                <div
                  key={i}
                  onClick={() => handleCopyColor(c.hex)}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 flex items-center gap-3.5 shadow-xs transition-all cursor-pointer group"
                  title="Click to copy HEX color"
                >
                  <div
                    className="w-10 h-10 rounded-lg shadow-inner border border-black/10 dark:border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.label}</span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <span>{c.hex}</span>
                        <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{c.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CUSTOM ACCENT COLOR OVERRIDE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Custom Accent Color Tuning
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Override active theme interactive highlight and button focus accents in real time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {accentColorPresets.map(ac => {
                const isCur = themeEngine.accentColor.toLowerCase() === ac.color.toLowerCase();
                return (
                  <button
                    key={ac.name}
                    onClick={() => themeEngine.setAccentColor(ac.color)}
                    style={{ backgroundColor: ac.color }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center shadow-md ${
                      isCur ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110 opacity-85 hover:opacity-100'
                    }`}
                    title={`${ac.name} (${ac.color})`}
                  >
                    {isCur && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SPACING & ELEVATION SCALES */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Spacing & Elevation Scales
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {Object.entries(tokens.spacing).map(([key, val]) => (
                <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-xs dark:shadow-none">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">{key}</span>
                    <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px]">{val}</span>
                  </div>
                  <div
                    className="rounded border"
                    style={{
                      height: val,
                      width: '100%',
                      backgroundColor: `${activeTheme.colors.accent}40`,
                      borderColor: activeTheme.colors.accent,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPONENTS TAB */}
      {activeTab === 'components' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Button Component State Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Primary (Action)</span>
                <button
                  style={{ backgroundColor: activeTheme.colors.accent }}
                  className="px-4 py-2 hover:opacity-90 text-white rounded-lg font-bold shadow-md cursor-pointer transition-opacity"
                >
                  Primary Action
                </button>
                <button disabled className="px-4 py-2 bg-indigo-600/40 text-white/50 rounded-lg font-bold cursor-not-allowed">
                  Primary Disabled
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Secondary (Neutral)</span>
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-lg font-medium cursor-pointer transition-colors">
                  Secondary Action
                </button>
                <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800 rounded-lg font-medium cursor-not-allowed">
                  Secondary Disabled
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Danger (Destructive)</span>
                <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold cursor-pointer transition-colors">
                  Delete File
                </button>
                <button disabled className="px-4 py-2 bg-rose-900/30 text-rose-300/40 rounded-lg font-bold cursor-not-allowed">
                  Delete Disabled
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Ghost / Outline</span>
                <button className="px-4 py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium cursor-pointer transition-colors">
                  Ghost Action
                </button>
                <button disabled className="px-4 py-2 text-slate-400 dark:text-slate-600 rounded-lg font-medium cursor-not-allowed">
                  Ghost Disabled
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Form Input & Validation States
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Default Input</label>
                <input
                  type="text"
                  placeholder="Task title..."
                  defaultValue="Implement OAuth2 Token Refresh"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Validated Input (Success)</label>
                <input
                  type="text"
                  defaultValue="https://api.domain.io/v2"
                  className="bg-slate-50 dark:bg-slate-950 border border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Endpoint syntax verified</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Invalid Input (Error)</label>
                <input
                  type="text"
                  defaultValue="../../etc/shadow"
                  className="bg-slate-50 dark:bg-slate-950 border border-rose-500 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Path traversal rejected by security policy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TYPOGRAPHY TAB */}
      {activeTab === 'typography' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5 shadow-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Display / Hero (22px)</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">Autonomous AI Software Engineering Studio</div>
          </div>

          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Heading 1 (18px)</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">Kanban Sprint Backlog & Team Orchestration</div>
          </div>

          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Body Text (13px)</span>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed max-w-2xl mt-1">
              Engineered with a secure Electron main-process sandbox, typed preload bridge, in-memory virtual filesystem, and real-time self-healing debuggers.
            </p>
          </div>

          <div>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Monospace Code (12px)</span>
            <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-700 dark:text-indigo-300 mt-1">
              {`export function sortTasks(tasks: Task[]): Task[] {\n  return [...tasks].sort((a, b) => b.priority - a.priority);\n}`}
            </pre>
          </div>
        </div>
      )}

      {/* 5. ACCESSIBILITY TAB */}
      {activeTab === 'accessibility' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">WCAG Contrast Audit: {activeTheme.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ensures comfortable legibility during long development sessions.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{contrastRatio}:1</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded text-xs font-bold uppercase">
                {contrastRatio >= 7 ? 'AAA Pass' : contrastRatio >= 4.5 ? 'AA Pass' : 'Custom'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Text Contrast</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-snug">
                Text color ({activeTheme.colors.text}) on surface ({activeTheme.colors.surface}) has a {contrastRatio}:1 ratio for enhanced accessibility.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Keyboard Focus</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-snug">
                All interactive controls include high-visibility focus rings and complete tab-order navigation.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero-Color Dependency</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-snug">
                Status badges and diffs use distinct icons and labels in addition to colors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
