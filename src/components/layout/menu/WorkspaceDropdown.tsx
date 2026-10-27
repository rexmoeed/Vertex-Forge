import React from 'react';
import { Check, FolderOpen } from 'lucide-react';

interface WorkspaceDropdownProps {
  isOpen: boolean;
  projects: any[];
  activeProjectId: string;
  onSwitchProject: (id: string) => void;
  onOpenNewProject?: () => void;
  onOpenLocalFolder?: () => void;
  onClose: () => void;
}

export const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  isOpen,
  projects,
  activeProjectId,
  onSwitchProject,
  onOpenNewProject,
  onOpenLocalFolder,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
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
            onSwitchProject(p.id);
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
            p.id === activeProjectId
              ? 'bg-emerald-500/20 text-[var(--ide-accent,#00ff88)] font-semibold'
              : 'hover:bg-white/5 text-white/80'
          }`}
        >
          <span className="truncate">{p.name}</span>
          {p.id === activeProjectId && <Check className="w-3 h-3 text-[var(--ide-accent,#00ff88)]" />}
        </button>
      ))}

      <div className="border-t border-white/10 my-1" />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
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
          onClose();
          onOpenLocalFolder?.();
        }}
        className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 font-medium flex items-center gap-1.5 cursor-pointer"
      >
        <FolderOpen className="w-3.5 h-3.5 text-white/60" />
        <span>Open Folder from Disk...</span>
      </button>
    </div>
  );
};
