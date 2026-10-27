import React from 'react';
import { FolderOpen, Sparkles, GitBranch } from 'lucide-react';

interface NoFolderOpenedViewProps {
  onOpenLocalFolder: () => void;
  onOpenProjectWizard: () => void;
  onOpenCloneModal: () => void;
}

export const NoFolderOpenedView: React.FC<NoFolderOpenedViewProps> = ({
  onOpenLocalFolder,
  onOpenProjectWizard,
  onOpenCloneModal,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 text-center select-none">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
        <FolderOpen className="w-6 h-6" />
      </div>
      <h3 className="text-xs font-bold text-white mb-1">No Folder Opened</h3>
      <p className="text-[11px] text-slate-400 mb-4 max-w-[210px] leading-relaxed">
        You have not yet opened a workspace folder. Open a project to start coding with AI tools.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-[190px]">
        <button
          onClick={onOpenLocalFolder}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Open Folder...</span>
        </button>
        <button
          onClick={onOpenProjectWizard}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>New Project with AI</span>
        </button>
        <button
          onClick={onOpenCloneModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
        >
          <GitBranch className="w-4 h-4 text-amber-400" />
          <span>Clone Git Repo</span>
        </button>
      </div>
    </div>
  );
};
