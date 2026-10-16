import React, { useState, useRef, useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useTheme } from '../../context/ThemeContext';
import {
  GitBranch,
  AlertCircle,
  AlertTriangle,
  FlaskConical,
  Sparkles,
  Bot,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Code2,
  CheckCircle2,
  BrainCircuit,
  Palette,
  ChevronUp,
} from 'lucide-react';

export const StatusBar: React.FC = () => {
  const themeEngine = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isThemeMenuOpen]);

  const {
    activeProject,
    activeFile,
    activeFileContent,
    problems,
    testResults,
    triggerSelfHealDebug,
    activeAgent,
    autonomyMode,
    isBottomPanelOpen,
    toggleBottomPanel,
    setBottomPanelTab,
    showPreview,
    setShowPreview,
    modifiedFiles,
    setActiveView,
    setIsMultiFileReviewOpen,
    setIsProjectIntelligenceOpen,
    cursorPosition,
  } = useIDE() as any;

  const errorCount = problems.filter((p: any) => p.severity === 'error').length;
  const warningCount = problems.filter((p: any) => p.severity === 'warning').length;
  const failedTests = testResults.filter((t: any) => t.status === 'failed').length;
  const passedTests = testResults.filter((t: any) => t.status === 'passed').length;

  // Compute lines in active file
  const lineCount = activeFileContent ? activeFileContent.split('\n').length : 1;

  // Language mode detection
  const getLanguageLabel = (path?: string) => {
    if (!path) return 'Plain Text';
    if (path.endsWith('.tsx')) return 'TypeScript React';
    if (path.endsWith('.ts')) return 'TypeScript';
    if (path.endsWith('.jsx')) return 'JavaScript React';
    if (path.endsWith('.js')) return 'JavaScript';
    if (path.endsWith('.py')) return 'Python 3.12';
    if (path.endsWith('.json')) return 'JSON';
    if (path.endsWith('.md')) return 'Markdown';
    if (path.endsWith('.css')) return 'Tailwind CSS';
    return 'Text';
  };

  // Cycle to next theme on click
  const handleCycleTheme = () => {
    const all = themeEngine.allThemes;
    const currentIndex = all.findIndex(t => t.id === themeEngine.themeId);
    const nextTheme = all[(currentIndex + 1) % all.length];
    if (nextTheme) {
      themeEngine.setTheme(nextTheme.id);
    }
  };

  return (
    <footer
      style={{
        backgroundColor: 'var(--ide-surface)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-accent, #00ff88)',
      }}
      className="h-6 border-t px-2 flex items-center justify-between text-[11px] font-mono select-none z-30 shrink-0 overflow-hidden min-w-0"
    >
      {/* Left: Remote Badge, Diagnostics, Git */}
      <div className="flex items-center gap-2">
        {/* Antigravity Green Remote Badge '><' */}
        <div
          className="px-1.5 py-0.5 rounded-xs font-black text-[10px] tracking-tighter flex items-center justify-center cursor-pointer select-none"
          style={{
            backgroundColor: 'var(--ide-accent, #00ff88)',
            color: '#000000',
          }}
          title="Vertex Forge Remote Connected: Local Workspace"
        >
          &gt;&lt;
        </div>

        {/* Diagnostics (Errors & Warnings) in neon green */}
        <button
          onClick={() => {
            if (!isBottomPanelOpen) toggleBottomPanel();
            setBottomPanelTab('problems');
          }}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer font-mono"
          style={{ color: 'var(--ide-accent, #00ff88)' }}
          title="Problems & Diagnostics"
        >
          <span className="flex items-center gap-1 font-bold">
            <span className="text-xs">⊗</span> {errorCount}
          </span>
          <span className="flex items-center gap-1 font-bold ml-1">
            <span className="text-xs">⚠</span> {warningCount}
          </span>
        </button>

        {/* Git Branch */}
        <button
          onClick={() => {
            if (modifiedFiles.length > 0) {
              setIsMultiFileReviewOpen(true);
            } else {
              setActiveView('editor');
            }
          }}
          className="hidden sm:flex items-center gap-1 hover:opacity-80 transition-opacity ml-2"
          style={{ color: 'var(--ide-accent, #00ff88)' }}
          title="Git Branch & Workspace Status"
        >
          <GitBranch className="w-3 h-3" />
          <span>main</span>
          {modifiedFiles.length > 0 && (
            <span className="text-[10px] text-amber-400 font-bold">*{modifiedFiles.length}</span>
          )}
        </button>
      </div>

      {/* Center: Antigravity AI Engine Status Pill */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => setActiveView('agents')}
          className="flex items-center gap-1.5 px-2 py-0.2 rounded-full border text-[10px] font-mono hover:opacity-80 transition-opacity"
          style={{
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-accent, #00ff88)',
            backgroundColor: 'rgba(0, 255, 136, 0.05)',
          }}
          title="Vertex Forge Autonomous Core"
        >
          <Sparkles className="w-2.5 h-2.5 animate-pulse" />
          <span>Vertex Forge Core</span>
          <span className="opacity-60">•</span>
          <span className="capitalize">{activeAgent}</span>
        </button>
      </div>

      {/* Right: Line/Col, Indent, Encoding, Language & Settings */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0" style={{ color: 'var(--ide-accent, #00ff88)' }}>
        <span>Ln {cursorPosition?.line || 1}, Col {cursorPosition?.column || 1}</span>
        <span>Spaces: 2</span>
        <span className="hidden sm:inline">UTF-8</span>
        <span className="hidden sm:inline">LF</span>
        <span className="flex items-center gap-1 font-semibold">
          <span>&#123;&#125;</span> {getLanguageLabel(activeFile)}
        </span>

        {/* Antigravity Theme Switcher */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer text-[11px]"
            title={`Active Theme: ${themeEngine.activeTheme.name} (Click to select Vertex Forge Themes)`}
          >
            <Palette className="w-3 h-3 text-[var(--ide-accent,#00ff88)]" />
            <span className="truncate max-w-[130px] font-sans font-medium">{themeEngine.activeTheme.name}</span>
            <ChevronUp className="w-2.5 h-2.5 opacity-60" />
          </button>

          {isThemeMenuOpen && (
            <div
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="absolute bottom-full right-0 mb-2 w-72 border rounded-xl shadow-2xl py-2 z-50 text-xs font-sans backdrop-blur-md"
            >
              <div className="px-3 pb-2 mb-1 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-[var(--ide-accent,#00ff88)]" />
                    <span>Vertex Forge Themes</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Select studio color palette</div>
                </div>
                <button
                  onClick={handleCycleTheme}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/15 text-[10px] text-white rounded font-mono cursor-pointer transition"
                  title="Cycle Next Theme"
                >
                  Next ↻
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 space-y-0.5 px-1">
                {themeEngine.allThemes.map(t => {
                  const isActive = themeEngine.themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        themeEngine.setTheme(t.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${
                        isActive ? 'font-bold text-[var(--ide-accent,#00ff88)] bg-white/5 shadow-xs' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                        <span className="truncate text-xs">{t.name}</span>
                        {t.id.startsWith('antigravity') && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                            AGY
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-mono font-bold text-[var(--ide-accent,#00ff88)]">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Vertex Forge - Settings link */}
        <button
          onClick={() => setActiveView('settings')}
          className="hover:underline flex items-center gap-1 cursor-pointer font-sans text-[11px]"
          title="Open Settings"
        >
          Vertex Forge - Settings
        </button>

        {/* Notification Bell */}
        <span className="cursor-pointer text-[12px] opacity-90 hover:opacity-100" title="Notifications">
          🔔
        </span>
      </div>
    </footer>
  );
};
