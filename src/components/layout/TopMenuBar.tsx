import { getDefaultCategoryCommands } from './menu/defaultMenuCommands';
import { logger } from '../../services/logger';
import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { useTheme } from '../../context/ThemeContext';
import { CommandRegistry, CommandCategory, Command } from '../../services/commandRegistry';
import {
  ChevronDown,
  Minus,
  Square,
  X,
  PanelLeft,
  PanelBottom,
  Search,
  Check,
  FolderOpen,
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
  onOpenShortcuts?: () => void;
  onOpenJulesMission?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onOpenCommandPalette,
  onOpenNewProject,
  onOpenComposer,
  onOpenCursorRules,
  onOpenShortcuts,
  onOpenJulesMission,
}) => {
  const ide = useIDE();
  const layout = useLayout();
  const themeEngine = useTheme();

  const activeProject = ide?.activeProject || { id: 'default', name: 'Vertex-Forge-main' };
  const projects = ide?.projects || [];
  const switchProject = ide?.switchProject;
  const activeFile = ide?.activeFile;
  const setActiveView = ide?.setActiveView;

  const [activeMenu, setActiveMenu] = useState<CommandCategory | null>(null);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [, setCommandVersion] = useState(0);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Subscribe to command registry updates
  useEffect(() => {
    return CommandRegistry.subscribe(() => {
      setCommandVersion(v => v + 1);
    });
  }, []);

  const handleCycleTheme = () => {
    const all = themeEngine.allThemes;
    const currentIndex = all.findIndex(t => t.id === themeEngine.themeId);
    const nextTheme = all[(currentIndex + 1) % all.length];
    if (nextTheme) {
      themeEngine.setTheme(nextTheme.id);
    }
  };

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

  // Helper to focus editor textarea for native actions
  const focusEditorTextarea = (): HTMLTextAreaElement | null => {
    const ta = document.querySelector('textarea.scrollbar-slim') as HTMLTextAreaElement | null;
    if (ta) {
      ta.focus();
      return ta;
    }
    return null;
  };

  // Close menus on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setIsProjectDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  // Keyboard navigation for menu bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeMenu && !isProjectDropdownOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveMenu(null);
        setIsProjectDropdownOpen(false);
        setSelectedIndex(-1);
        return;
      }

      if (activeMenu) {
        const commands = getCategoryCommands(activeMenu);
        const currentCatIndex = menuCategories.indexOf(activeMenu);

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextCat = menuCategories[(currentCatIndex + 1) % menuCategories.length];
          setActiveMenu(nextCat);
          setSelectedIndex(-1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevCat = menuCategories[(currentCatIndex - 1 + menuCategories.length) % menuCategories.length];
          setActiveMenu(prevCat);
          setSelectedIndex(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % commands.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < commands.length) {
            const cmd = commands[selectedIndex];
            if (!cmd.isEnabled || cmd.isEnabled()) {
              executeCommandItem(cmd);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenu, isProjectDropdownOpen, selectedIndex]);

  const handleMenuClick = (e: React.MouseEvent, cat: CommandCategory) => {
    e.stopPropagation();
    setActiveMenu(prev => (prev === cat ? null : cat));
    setIsProjectDropdownOpen(false);
    setSelectedIndex(-1);
  };

  const handleMenuHover = (cat: CommandCategory) => {
    if (activeMenu !== null && activeMenu !== cat) {
      setActiveMenu(cat);
      setSelectedIndex(-1);
    }
  };

  const executeCommandItem = async (cmd: Command) => {
    setActiveMenu(null);
    setSelectedIndex(-1);
    try {
      if (cmd.execute) {
        await cmd.execute();
      } else {
        await CommandRegistry.execute(cmd.id);
      }
    } catch (err) {
      logger.error(`Error executing ${cmd.id}:`, err);
    }
  };

  // Built-in fallback commands if registry has not yet populated a category
  const getCategoryCommands = (cat: CommandCategory): Command[] => {
    const registered = CommandRegistry.getByCategory(cat);
    if (registered && registered.length > 0) {
      return registered;
    }

    return getDefaultCategoryCommands(cat, {
      ide,
      layout,
      themeEngine,
      onOpenNewProject,
      onOpenCommandPalette,
      onOpenShortcuts,
      onOpenComposer,
      onOpenCursorRules,
      onOpenJulesMission,
      handleCycleTheme,
      setActiveView,
      focusEditorTextarea,
    });
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
      className="h-8 border-b px-2 flex items-center justify-between select-none z-[100] text-xs font-sans relative shrink-0"
    >
      {/* 1. LEFT: Brand Emblem, Menus & Workspace Switcher */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Vertex Forge Brand Emblem */}
        <div className="flex items-center gap-1.5 px-1 mr-0.5">
          <div
            style={{
              color: 'var(--ide-accent, #00ff88)',
            }}
            className="w-4 h-4 flex items-center justify-center font-bold text-xs"
            title="Vertex Forge Studio"
          >
            ▲
          </div>
        </div>

        {/* Workspace Project Dropdown Pill */}
        <div className="relative mr-1 hidden sm:block">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsProjectDropdownOpen(!isProjectDropdownOpen);
              setActiveMenu(null);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors cursor-pointer"
            title={`Workspace: ${activeProject?.name || 'Vertex-Forge-main'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ide-accent,#00ff88)] animate-pulse" />
            <span className="truncate max-w-[110px] font-mono text-[11px]">{activeProject?.name || 'Workspace'}</span>
            <ChevronDown className="w-3 h-3 text-white/50 shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div
              style={{
                backgroundColor: 'var(--ide-surface-elevated, #151926)',
                borderColor: 'var(--ide-border, rgba(255,255,255,0.1))',
                color: 'var(--ide-text, #ffffff)',
              }}
              className="absolute top-full left-0 mt-1 w-64 backdrop-blur-xl border rounded-lg shadow-2xl py-1 z-[110] animate-fadeIn"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                Workspaces
              </div>
              {(projects || []).map((p: any) => (
                <button
                  key={p.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsProjectDropdownOpen(false);
                  onOpenNewProject?.();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-[var(--ide-accent,#00ff88)] hover:bg-emerald-500/10 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> New Project with AI Architect...
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsProjectDropdownOpen(false);
                  ide.openLocalFolder?.();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-white/60" />
                <span>Open Folder from Disk...</span>
              </button>
            </div>
          )}
        </div>

        {/* Application Menus - always accessible */}
        <div className="flex items-center">
          {menuCategories.map(cat => {
            const isOpen = activeMenu === cat;
            const commands = getCategoryCommands(cat);

            return (
              <div key={cat} className="relative">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMenu(prev => (prev === cat ? null : cat));
                    setIsProjectDropdownOpen(false);
                    setSelectedIndex(-1);
                  }}
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
                      backgroundColor: 'var(--ide-surface-elevated, #151926)',
                      borderColor: 'var(--ide-border, rgba(255,255,255,0.1))',
                      color: 'var(--ide-text, #ffffff)',
                    }}
                    className="absolute top-full left-0 mt-0.5 min-w-[270px] border rounded-lg shadow-2xl py-1 z-[110] animate-fadeIn backdrop-blur-xl"
                  >
                    {commands.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] italic" style={{ color: 'var(--ide-text-muted)' }}>
                        No commands available
                      </div>
                    ) : (
                      commands.map((cmd, idx) => {
                        const isEnabled = cmd.isEnabled ? cmd.isEnabled() : true;
                        const isSelected = selectedIndex === idx;

                        return (
                          <button
                            key={cmd.id}
                            disabled={!isEnabled}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isEnabled) {
                                executeCommandItem(cmd);
                              }
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            style={{
                              color: isEnabled ? 'var(--ide-text)' : 'var(--ide-text-muted)',
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-emerald-500/25 text-[var(--ide-accent,#00ff88)]'
                                : isEnabled
                                ? 'hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] cursor-pointer'
                                : 'cursor-not-allowed opacity-40'
                            }`}
                          >
                            <span className="truncate pr-4">{cmd.title}</span>
                            {cmd.shortcut && (
                              <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-white/5 border border-white/10" style={{ color: 'var(--ide-text-muted)' }}>
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
          onClick={() => layout.togglePrimarySidebar?.()}
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
            title="Go Back (Alt+Left)"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="p-1 hover:bg-white/10 rounded cursor-pointer hover:text-white"
            title="Go Forward (Alt+Right)"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. CENTER: Unified Antigravity / Cursor Omnibar Search Pill */}
      <div className="flex-1 flex justify-center max-w-xs md:max-w-md lg:max-w-lg mx-2 min-w-0">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between gap-2 px-3 py-1 bg-black/60 hover:bg-black/90 border border-white/10 hover:border-emerald-500/50 rounded-lg text-xs transition-all shadow-inner group cursor-pointer min-w-0 overflow-hidden"
          title="Search files, symbols & commands (Ctrl+P / Cmd+K)"
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <Search className="w-3.5 h-3.5 text-[var(--ide-accent,#00ff88)] shrink-0" />
            <span className="truncate text-white/70 group-hover:text-white font-sans text-[11px] min-w-0">
              {currentFileName ? `${activeProject?.name || 'Vertex-Forge-main'} › ${currentFileName}` : 'Ask AI or search files & commands...'}
            </span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-white/10 text-white/80 border border-white/10 rounded shrink-0">
            Ctrl+P
          </kbd>
        </button>
      </div>

      {/* 3. RIGHT: Workspace Name, Active Model, Panel Toggles & Window Controls */}
      <div className="flex items-center gap-2 text-xs shrink-0">
        {/* Workspace Title */}
        <span className="font-mono text-[11px] text-white/80 hover:text-white transition cursor-pointer hidden md:inline truncate max-w-[130px]">
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

        {/* Google Jules Cloud Agent Mission Button */}
        <button
          onClick={onOpenJulesMission}
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition cursor-pointer shadow-xs"
          title="Google Jules Cloud Agent: Autonomous PR missions in sandboxed cloud VM"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Jules Cloud</span>
        </button>

        {/* Toggle Bottom Dock */}
        <button
          onClick={() => layout.toggleBottomPanel?.()}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded cursor-pointer"
          title="Toggle Terminal Panel (Ctrl+`)"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>

        {/* Toggle AI Panel */}
        <button
          onClick={() => layout.toggleSecondarySidebar?.()}
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
