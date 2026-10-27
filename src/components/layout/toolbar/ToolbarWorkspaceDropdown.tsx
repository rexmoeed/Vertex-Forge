import React, { useState } from 'react';
import { useIDE } from '../../../context/IDEContext';
import { useLayout } from '../../../context/LayoutContext';
import { ChevronDown } from 'lucide-react';

interface ToolbarWorkspaceDropdownProps {
  onOpenNewProject: () => void;
}

export const ToolbarWorkspaceDropdown: React.FC<ToolbarWorkspaceDropdownProps> = ({
  onOpenNewProject,
}) => {
  const { activeProject, projects, switchProject, devServerProcess } = useIDE();
  const layout = useLayout();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative min-w-0">
        <button
          onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          title={`Workspace: ${activeProject.name}`}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-indigo-400 text-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 dark:border-slate-800 dark:hover:border-indigo-500/40 dark:text-slate-200 transition-all shadow-xs cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 animate-pulse" />
          <span className="truncate max-w-[140px] font-medium">{activeProject.name}</span>
          <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
        </button>

        {isProjectDropdownOpen && (
          <div
            style={{
              backgroundColor: 'var(--ide-surface-elevated)',
              borderColor: 'var(--ide-border)',
              color: 'var(--ide-text)',
            }}
            className="absolute top-full left-0 mt-1 w-72 backdrop-blur-xl border rounded-xl shadow-2xl py-1 z-50 animate-fadeIn"
          >
            <div
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--ide-text-muted)' }}
            >
              Workspaces
            </div>
            {projects.map((p: any) => (
              <button
                key={p.id}
                onClick={() => {
                  switchProject(p.id);
                  setIsProjectDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors cursor-pointer ${
                  p.id === activeProject.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-200'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                }`}
              >
                <span className="font-semibold truncate">{p.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{p.techStack.frontend}</span>
              </button>
            ))}

            <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
            <button
              onClick={() => {
                setIsProjectDropdownOpen(false);
                onOpenNewProject();
              }}
              className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> New Project with AI Architect...
            </button>
          </div>
        )}
      </div>

      {/* Live Dev Server Status Pill */}
      <button
        onClick={layout.togglePreview}
        className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-[11px] font-mono transition-colors dark:bg-slate-900/80 dark:border-slate-800 cursor-pointer shrink-0"
        title="Click to toggle Live Preview Sandbox"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
          {devServerProcess ? `:${devServerProcess.port || 3000}` : ':3000'}
        </span>
        <span className="text-slate-400 text-[10px]">live</span>
      </button>
    </div>
  );
};
