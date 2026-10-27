import React from 'react';
import {
  Minus,
  Square,
  X,
  PanelBottom,
  MessageSquare,
  Settings,
  Palette,
} from 'lucide-react';
import { useLayout } from '../../../context/LayoutContext';
import { useTheme } from '../../../context/ThemeContext';

interface TopMenuBarRightControlsProps {
  activeProjectName: string;
  onOpenJulesMission?: () => void;
  onSetActiveView?: (view: any) => void;
}

export const TopMenuBarRightControls: React.FC<TopMenuBarRightControlsProps> = ({
  activeProjectName,
  onOpenJulesMission,
  onSetActiveView,
}) => {
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

  return (
    <div className="flex items-center gap-2 text-xs shrink-0">
      {/* Workspace Title */}
      <span className="font-mono text-[11px] text-white/80 hover:text-white transition cursor-pointer hidden md:inline truncate max-w-[130px]">
        {activeProjectName}
      </span>

      {/* Active AI Model Pill */}
      <button
        onClick={() => onSetActiveView?.('providers')}
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
        onClick={() => onSetActiveView?.('settings')}
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
  );
};
