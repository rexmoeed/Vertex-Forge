import React, { useState } from 'react';
import { Palette, Check, Copy } from 'lucide-react';
import { ThemeDefinition } from '../../../types/theme';

interface DesignTokensTabProps {
  activeTheme: ThemeDefinition;
  allThemesList: ThemeDefinition[];
  themeFilter: 'all' | 'dark' | 'light' | 'high-contrast';
  setThemeFilter: (filter: 'all' | 'dark' | 'light' | 'high-contrast') => void;
  filteredThemes: ThemeDefinition[];
  themeEngine: any;
  tokens: any;
  accentColorPresets: Array<{ name: string; color: string }>;
}

export const DesignTokensTab: React.FC<DesignTokensTabProps> = ({
  activeTheme,
  allThemesList,
  themeFilter,
  setThemeFilter,
  filteredThemes,
  themeEngine,
  tokens,
  accentColorPresets,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

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

  const handleCopyColor = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  return (
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

      {/* DYNAMIC SEMANTIC COLOR PALETTE TOKENS */}
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
                <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px]">{String(val)}</span>
              </div>
              <div
                className="rounded border"
                style={{
                  height: String(val),
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
  );
};
