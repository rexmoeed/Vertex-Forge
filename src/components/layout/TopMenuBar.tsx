import { getDefaultCategoryCommands } from './menu/defaultMenuCommands';
import { logger } from '../../services/logger';
import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { CommandRegistry, CommandCategory, Command } from '../../services/commandRegistry';
import {
  ChevronDown,
  PanelLeft,
  Search,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { WorkspaceDropdown } from './menu/WorkspaceDropdown';
import { TopMenuBarRightControls } from './menu/TopMenuBarRightControls';

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setIsProjectDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keyboard navigation within active dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeMenu) return;

    const commands = getCategoryCommands(activeMenu);
    if (commands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % commands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const cmd = commands[selectedIndex];
      if (cmd && (!cmd.isEnabled || cmd.isEnabled())) {
        executeCommandItem(cmd);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIdx = menuCategories.indexOf(activeMenu);
      const nextCat = menuCategories[(currentIdx + 1) % menuCategories.length];
      setActiveMenu(nextCat);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIdx = menuCategories.indexOf(activeMenu);
      const prevCat = menuCategories[(currentIdx - 1 + menuCategories.length) % menuCategories.length];
      setActiveMenu(prevCat);
      setSelectedIndex(-1);
    }
  };

  const getCategoryCommands = (cat: CommandCategory): Command[] => {
    const registered = CommandRegistry.getByCategory(cat);
    if (registered.length > 0) return registered;

    return getDefaultCategoryCommands(cat, {
      ide,
      layout,
      focusEditorTextarea,
      onOpenNewProject,
      onOpenCommandPalette,
      onOpenComposer,
      onOpenCursorRules,
      onOpenShortcuts,
      onOpenJulesMission,
    });
  };

  const executeCommandItem = (cmd: Command) => {
    setActiveMenu(null);
    setSelectedIndex(-1);
    try {
      cmd.execute();
    } catch (err: unknown) {
      logger.error(`Error running command "${cmd.title}"`, { cmdId: cmd.id }, err);
    }
  };

  const handleMenuHover = (cat: CommandCategory) => {
    if (activeMenu && activeMenu !== cat) {
      setActiveMenu(cat);
      setSelectedIndex(-1);
    }
  };

  const currentFileName = activeFile ? activeFile.split('/').pop() : null;

  return (
    <div
      ref={menuBarRef}
      onKeyDown={handleKeyDown}
      style={{
        backgroundColor: 'var(--ide-surface, #0f131f)',
        borderColor: 'var(--ide-border, rgba(255,255,255,0.08))',
        color: 'var(--ide-text, #ffffff)',
      }}
      className="h-8 border-b flex items-center justify-between px-2 text-xs select-none z-[100] shrink-0 font-sans tracking-tight"
    >
      {/* 1. LEFT: Workspace Pill, Native App Menus, Sidebar Toggle */}
      <div className="flex items-center gap-1">
        {/* Workspace Quick-Switch Pill */}
        <div className="relative mr-1">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsProjectDropdownOpen(prev => !prev);
              setActiveMenu(null);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors cursor-pointer"
            title={`Workspace: ${activeProject?.name || 'Vertex-Forge-main'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ide-accent,#00ff88)] animate-pulse" />
            <span className="truncate max-w-[110px] font-mono text-[11px]">{activeProject?.name || 'Workspace'}</span>
            <ChevronDown className="w-3 h-3 text-white/50 shrink-0" />
          </button>

          <WorkspaceDropdown
            isOpen={isProjectDropdownOpen}
            projects={projects}
            activeProjectId={activeProject.id}
            onSwitchProject={(id) => switchProject?.(id)}
            onOpenNewProject={onOpenNewProject}
            onOpenLocalFolder={() => ide.openLocalFolder?.()}
            onClose={() => setIsProjectDropdownOpen(false)}
          />
        </div>

        {/* Application Menus */}
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

      {/* 2. CENTER: Unified Omnibar Search Pill */}
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

      {/* 3. RIGHT: Controls */}
      <TopMenuBarRightControls
        activeProjectName={activeProject?.name || 'Vertex-Forge-main'}
        onOpenJulesMission={onOpenJulesMission}
        onSetActiveView={setActiveView}
      />
    </div>
  );
};
