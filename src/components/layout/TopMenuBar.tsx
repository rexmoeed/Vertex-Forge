import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { useTheme } from '../../context/ThemeContext';
import { CommandRegistry, CommandCategory } from '../../services/commandRegistry';
import {
  ChevronDown,
  Minus,
  Square,
  X,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Search,
  Sparkles,
  Check,
  FolderOpen,
  Cpu,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Settings,
  Palette,
} from 'lucide-react';

interface TopMenuBarProps {
  onOpenCommandPalette?: () => void;
  onOpenNewProject?: () => void;
  onOpenComposer?: () => void;
  onOpenCursorRules?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onOpenCommandPalette,
  onOpenNewProject,
  onOpenComposer,
  onOpenCursorRules,
}) => {
  const { activeProject, projects, switchProject, activeFile, devServerProcess, setActiveView } = useIDE() as any;
  const layout = useLayout();
  const themeEngine = useTheme();

  const handleCycleTheme = () => {
    const all = themeEngine.allThemes;
    const currentIndex = all.findIndex(t => t.id === themeEngine.themeId);
    const nextTheme = all[(currentIndex + 1) % all.length];
    if (nextTheme) {
      themeEngine.setTheme(nextTheme.id);
    }
  };

  const [activeMenu, setActiveMenu] = useState<CommandCategory | null>(null);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-3.8-flash');
  const menuBarRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High)', desc: 'Multimodal Autonomous Coding Engine' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', desc: 'Anthropic Hybrid Extended Thinking' },
    { id: 'gpt-4o', name: 'GPT-4o Omni', desc: 'OpenAI Multimodal Flagship' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Open Weights Deep Reasoning' },
  ];

  const currentModelObj = models.find(m => m.id === activeModel) || models[0];

  const menuCategories: CommandCategory[] = [
    'File',
    'Edit',
    'Selection',
    'View',
    'Go',
    'Run',
    'Terminal',
    'Agent / AI',
    'Help',
  ];

  // Close menus on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setIsProjectDropdownOpen(false);
        setIsModelDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setIsProjectDropdownOpen(false);
        setIsModelDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMenuClick = (cat: CommandCategory) => {
    setActiveMenu(prev => (prev === cat ? null : cat));
    setIsProjectDropdownOpen(false);
    setIsModelDropdownOpen(false);
  };

  const handleMenuHover = (cat: CommandCategory) => {
    if (activeMenu !== null) {
      setActiveMenu(cat);
    }
  };

  const handleCommandClick = async (cmdId: string) => {
    setActiveMenu(null);
    await CommandRegistry.execute(cmdId);
  };

  const currentFileName = activeFile ? activeFile.split('/').pop() : null;

  return (
    <div
      ref={menuBarRef}
      style={{
        backgroundColor: 'var(--ide-surface)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-text)',
      }}
      className="h-8 border-b px-2 flex items-center justify-between select-none z-50 text-xs font-sans relative shrink-0"
    >
      {/* 1. LEFT: Brand Emblem, Menus & Workspace Switcher */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Antigravity Brand Emblem */}
        <div className="flex items-center gap-1.5 px-1 mr-0.5">
          <div
            style={{
              color: 'var(--ide-accent, #00ff88)',
            }}
            className="w-4 h-4 flex items-center justify-center font-bold text-xs"
            title="Antigravity Studio"
          >
            ▲
          </div>
        </div>

        {/* Workspace Project Dropdown Pill */}
        <div className="relative mr-1 hidden sm:block">
          <button
            onClick={() => {
              setIsProjectDropdownOpen(!isProjectDropdownOpen);
              setActiveMenu(null);
              setIsModelDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors cursor-pointer"
            title={`Workspace: ${activeProject.name || 'Vertex-Forge-main'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ide-accent,#00ff88)] animate-pulse" />
            <span className="truncate max-w-[110px] font-mono text-[11px]">{activeProject.name || 'Vertex-Forge-main'}</span>
            <ChevronDown className="w-3 h-3 text-white/50 shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="absolute top-full left-0 mt-1 w-64 backdrop-blur-xl border rounded-lg shadow-2xl py-1 z-50 animate-fadeIn"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                Workspaces
              </div>
              {(projects || []).map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchProject?.(p.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    p.id === activeProject.id
                      ? 'bg-emerald-500/20 text-[var(--ide-accent,#00ff88)] font-semibold'
                      : 'hover:bg-white/5 text-white/80'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {p.id === activeProject.id && <Check className="w-3 h-3 text-[var(--ide-accent,#00ff88)]" />}
                </button>
              ))}

              <div className="border-t border-white/10 my-1" />
              <button
                onClick={() => {
                  setIsProjectDropdownOpen(false);
                  onOpenNewProject?.();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-[var(--ide-accent,#00ff88)] hover:bg-emerald-500/10 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> New Project with AI Architect...
              </button>
            </div>
          )}
        </div>

        {/* Application Menus */}
        <div className="hidden md:flex items-center">
          {menuCategories.map(cat => {
            const isOpen = activeMenu === cat;
            const commands = CommandRegistry.getByCategory(cat);

            return (
              <div key={cat} className="relative">
                <button
                  onClick={() => handleMenuClick(cat)}
                  onMouseEnter={() => handleMenuHover(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    isOpen
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-white/75 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat === 'Agent / AI' ? 'AI' : cat}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div
                    style={{
                      backgroundColor: 'var(--ide-surface-elevated)',
                      borderColor: 'var(--ide-border)',
                      color: 'var(--ide-text)',
                    }}
                    className="absolute top-full left-0 mt-0.5 min-w-[240px] border rounded-lg shadow-xl py-1 z-50 animate-fadeIn"
                  >
                    {commands.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] italic" style={{ color: 'var(--ide-text-muted)' }}>
                        No commands available
                      </div>
                    ) : (
                      commands.map(cmd => {
                        const isEnabled = cmd.isEnabled ? cmd.isEnabled() : true;

                        return (
                          <button
                            key={cmd.id}
                            disabled={!isEnabled}
                            onClick={() => handleCommandClick(cmd.id)}
                            style={{
                              color: isEnabled ? 'var(--ide-text)' : 'var(--ide-text-muted)',
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                              isEnabled
                                ? 'hover:bg-emerald-500/20 cursor-pointer'
                                : 'cursor-not-allowed opacity-50'
                            }`}
                          >
                            <span className="truncate pr-4">{cmd.title}</span>
                            {cmd.shortcut && (
                              <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--ide-text-muted)' }}>
                                {cmd.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Toggle Primary Sidebar */}
        <button
          onClick={layout.togglePrimarySidebar}
          className="p-1 ml-1 text-white/60 hover:text-white hover:bg-white/10 rounded cursor-pointer"
          title="Toggle Primary Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Navigation arrows */}
        <div className="flex items-center gap-0.5 text-white/50">
          <button
            onClick={() => window.history.back()}
            className="p-1 hover:bg-white/10 rounded cursor-pointer hover:text-white"
            title="Go Back"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="p-1 hover:bg-white/10 rounded cursor-pointer hover:text-white"
            title="Go Forward"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. CENTER: Unified Antigravity / Cursor Omnibar Search Pill */}
      <div className="flex-1 flex justify-center max-w-xs md:max-w-md lg:max-w-lg mx-2">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between gap-2 px-3 py-1 bg-black/60 hover:bg-black/90 border border-white/10 hover:border-emerald-500/50 rounded-lg text-xs transition-all shadow-inner group cursor-pointer"
          title="Search files, symbols & commands (Ctrl+P / Cmd+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[var(--ide-accent,#00ff88)] shrink-0" />
            <span className="truncate text-white/70 group-hover:text-white font-sans text-[11px]">
              {currentFileName ? `${activeProject.name || 'Vertex-Forge-main'} › ${currentFileName}` : 'Ask AI or search files & commands...'}
            </span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-white/10 text-white/80 border border-white/10 rounded shrink-0">
            Ctrl+P
          </kbd>
        </button>
      </div>

      {/* 3. RIGHT: Workspace Name, Upgrade to Pro, Panel Toggles & Window Controls */}
      <div className="flex items-center gap-2 text-xs shrink-0">
        {/* Workspace Title */}
        <span className="font-mono text-[11px] text-white/80 hover:text-white transition cursor-pointer hidden md:inline">
          {activeProject?.name || 'Vertex-Forge-main'}
        </span>

        {/* Active AI Model Pill */}
        <button
          onClick={() => setActiveView?.('providers')}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[11px] font-medium transition cursor-pointer"
          title="Active Model: Gemini 3.8 Flash (Click to configure AI Providers & BYOK)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gemini 3.8 Flash</span>
        </button>

        {/* Toggle Bottom Dock */}
        <button
          onClick={layout.toggleBottomPanel}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded cursor-pointer"
          title="Toggle Terminal Panel (Ctrl+`)"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>

        {/* Toggle AI Panel */}
        <button
          onClick={layout.toggleSecondarySidebar}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded cursor-pointer"
          title="Toggle AI Chat Panel (Ctrl+J)"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        {/* Antigravity Theme Switcher */}
        <button
          onClick={handleCycleTheme}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
          title={`Active Theme: ${themeEngine.activeTheme.name} (Click to switch Antigravity themes)`}
        >
          <Palette className="w-3.5 h-3.5 text-[var(--ide-accent,#00ff88)]" />
        </button>

        {/* Settings Gear */}
        <button
          onClick={() => setActiveView?.('settings')}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded cursor-pointer"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Native Window Controls */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10 text-white/70">
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1 hover:bg-white/10 rounded cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1 hover:bg-white/10 rounded cursor-pointer"
            title="Toggle Fullscreen / Maximize"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => {
              if (confirm('Close Vertex Forge workspace?')) {
                window.close();
              }
            }}
            className="p-1 hover:bg-rose-500/30 hover:text-rose-400 rounded cursor-pointer"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
