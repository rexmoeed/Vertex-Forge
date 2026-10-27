import React from 'react';
import { useLayout } from '../../../context/LayoutContext';
import {
  PanelLeft,
  PanelBottom,
  PanelRight,
  ExternalLink,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export const ToolbarPanelToggles: React.FC = () => {
  const layout = useLayout();

  return (
    <div className="flex items-center gap-1">
      {/* Toggle Primary Sidebar */}
      <button
        onClick={layout.togglePrimarySidebar}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          layout.config.primarySidebarVisible
            ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
        }`}
        title="Toggle Primary Sidebar (Cmd+B)"
      >
        <PanelLeft className="w-3.5 h-3.5" />
      </button>

      {/* Toggle Bottom Terminal Panel */}
      <button
        onClick={layout.toggleBottomPanel}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          layout.config.bottomPanelVisible
            ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
        }`}
        title="Toggle Bottom Terminal Dock (Cmd+`)"
      >
        <PanelBottom className="w-3.5 h-3.5" />
      </button>

      {/* Toggle Secondary AI Panel */}
      <button
        onClick={layout.toggleSecondarySidebar}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          layout.config.secondarySidebarVisible
            ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
        }`}
        title="Toggle AI Assistant Panel (Cmd+Alt+B)"
      >
        <PanelRight className="w-3.5 h-3.5" />
      </button>

      {/* Toggle Live Preview */}
      <button
        onClick={layout.togglePreview}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          layout.config.previewVisible
            ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
        }`}
        title="Toggle Live Sandbox Preview (Cmd+Shift+V)"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>

      {/* Toggle Zen Mode */}
      <button
        onClick={layout.toggleZenMode}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          layout.config.isZenMode
            ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
        }`}
        title="Toggle Zen / Distraction-Free Mode (Cmd+Shift+Z)"
      >
        {layout.config.isZenMode ? (
          <Minimize2 className="w-3.5 h-3.5" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
