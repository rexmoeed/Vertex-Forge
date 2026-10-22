import React, { useState, useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  Sparkles,
  FolderOpen,
  GitBranch,
  Key,
  PlusCircle,
  FileCode,
  ArrowRight,
  Clock,
  Trash2,
  ExternalLink,
  Laptop,
  Server,
  Zap,
  Compass,
} from 'lucide-react';
import { RecentProjects } from '../../services/recentProjects';
import { RecentProject } from '../../types/project';

interface WelcomeViewProps {
  onOpenNewProject: () => void;
  onOpenShortcuts: () => void;
  onOpenTour?: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onOpenNewProject, onOpenShortcuts, onOpenTour }) => {
  const {
    openLocalFolder,
    openLocalFile,
    setIsCloneModalOpen,
    setIsProjectWizardOpen,
    setActiveView,
  } = useIDE();

  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    setRecentProjects(RecentProjects.getRecentProjects());
  }, []);

  const handleOpenRecent = async (path: string) => {
    await openLocalFolder(path);
  };

  const handleRemoveRecent = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    RecentProjects.removeProject(path);
    setRecentProjects(RecentProjects.getRecentProjects());
  };

  const starterBlueprints = [
    {
      id: 'react-vite',
      title: 'React 19 + Vite + Tailwind v4',
      desc: 'Next-gen reactive client frontend with strict TypeScript contracts and Tailwind v4.',
      tag: 'Frontend',
      icon: <Laptop className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'node-express',
      title: 'Node.js Express + TypeScript API',
      desc: 'Modular REST API server with health monitoring, routing, and request validation.',
      tag: 'Backend',
      icon: <Server className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'nextjs-fullstack',
      title: 'Next.js 15 Full-Stack Studio',
      desc: 'App router, server actions, React 19 SSR, and modern component architecture.',
      tag: 'Full-Stack',
      icon: <Zap className="w-4 h-4 text-indigo-400" />,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-editor-bg)',
        color: 'var(--ide-text)',
      }}
      className="flex-1 w-full h-full overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-start select-none min-h-0"
    >
      <div className="w-full max-w-4xl flex flex-col gap-10 py-6">
        {/* Hero Branding */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/25">
              V
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Vertex<span className="text-indigo-400">Forge</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Production Studio
                  </span>
                </h1>
                {onOpenTour && (
                  <button
                    onClick={onOpenTour}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all cursor-pointer hover:scale-102"
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-200 animate-spin-slow" />
                    <span>Feature Tour & Overview</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous AI software engineering IDE with real host filesystem, genuine terminal execution, and multi-provider intelligence.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Open Local Folder */}
          <button
            onClick={() => openLocalFolder()}
            className="group p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-500 text-left transition-all shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between h-40 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>Open Folder...</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Open any existing codebase or project folder on your computer.
              </p>
            </div>
          </button>

          {/* 2. Open Single File */}
          <button
            onClick={() => openLocalFile()}
            className="group p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30 hover:border-purple-500 text-left transition-all shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between h-40 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                <span>Open File...</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Open and edit a standalone source file or script directly.
              </p>
            </div>
          </button>

          {/* 2. Clone Repository */}
          <button
            onClick={() => setIsCloneModalOpen(true)}
            className="group p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 text-left transition-all shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between h-40 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                <span>Clone Repository</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Clone a repository from GitHub, GitLab, or any remote Git URL.
              </p>
            </div>
          </button>

          {/* 3. New Project with AI */}
          <button
            onClick={() => setIsProjectWizardOpen(true)}
            className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-left transition-all shadow-lg hover:shadow-slate-800/50 flex flex-col justify-between h-40 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>New Project with AI</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Describe your requirements and let the AI team architect and scaffold your app.
              </p>
            </div>
          </button>

          {/* 4. AI Providers */}
          <button
            onClick={() => setActiveView('providers')}
            className="group p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/30 hover:border-amber-500/60 text-left transition-all shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between h-40 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                <span>AI Providers (BYOK)</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Connect your Gemini, OpenAI, Claude, DeepSeek, or local Ollama models.
              </p>
            </div>
          </button>
        </div>

        {/* Recent Workspaces / Projects Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Recent Workspaces</span>
            </span>
            {recentProjects.length > 0 && (
              <span className="text-[11px] text-slate-500">
                {recentProjects.length} project{recentProjects.length > 1 ? 's' : ''} recorded
              </span>
            )}
          </div>

          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentProjects.map(proj => (
                <div
                  key={proj.path}
                  onClick={() => handleOpenRecent(proj.path)}
                  className="group p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {proj.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        {proj.path}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {proj.framework || 'Project'}
                    </span>
                    <button
                      onClick={(e) => handleRemoveRecent(e, proj.path)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                      title="Remove from recent"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/30 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
              <FolderOpen className="w-6 h-6 text-slate-600" />
              <p className="text-xs font-medium">No recent workspaces yet</p>
              <p className="text-[11px] text-slate-500">
                Click <span className="text-indigo-400 font-semibold cursor-pointer hover:underline" onClick={() => openLocalFolder()}>Open Folder</span> above to load your active project into Vertex Forge.
              </p>
            </div>
          )}
        </div>

        {/* Starter Architecture Starters */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Production Architecture Starters
            </span>
            <span className="text-[11px] text-slate-500">Scaffold verified starter into your directory</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {starterBlueprints.map(tmpl => (
              <div
                key={tmpl.id}
                onClick={() => setIsProjectWizardOpen(true)}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col justify-between gap-3 shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                      {tmpl.tag}
                    </span>
                    {tmpl.icon}
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2 leading-snug group-hover:text-indigo-300 transition-colors">
                    {tmpl.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {tmpl.desc}
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                  <span>Scaffold Project</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guided Quickstart Shortcuts */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Cmd/Ctrl + P</kbd>
              <span>Quick File Open</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Cmd/Ctrl + S</kbd>
              <span>Save File</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Cmd/Ctrl + `</kbd>
              <span>Toggle Terminal</span>
            </div>
          </div>

          <button
            onClick={onOpenShortcuts}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline"
          >
            All Keyboard Shortcuts
          </button>
        </div>
      </div>
    </div>
  );
};
