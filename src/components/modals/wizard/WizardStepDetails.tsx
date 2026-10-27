import React from 'react';
import {
  Globe,
  Smartphone,
  Server,
  Zap,
  Check,
  RotateCw,
  Copy,
  AlertCircle,
  GitBranch,
} from 'lucide-react';
import {
  ProjectTypeCategory,
  ArchitectureType,
  PackageManager,
  PathValidationResult,
} from '../../../types/scaffolding';

interface Props {
  category: ProjectTypeCategory;
  setCategory: (c: ProjectTypeCategory) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  parentDir: string;
  setParentDir: (dir: string) => void;
  onBrowseParentDir: () => void;
  finalProjectPath: string;
  validationResult: PathValidationResult;
  isValidatingPath: boolean;
  onCopyPath: () => void;
  projectDescription: string;
  setProjectDescription: (desc: string) => void;
  packageManager: PackageManager;
  setPackageManager: (pm: PackageManager) => void;
  architecture: ArchitectureType;
  setArchitecture: (arch: ArchitectureType) => void;
  initGit: boolean;
  setInitGit: (init: boolean) => void;
}

export const WizardStepDetails: React.FC<Props> = ({
  category,
  setCategory,
  projectName,
  setProjectName,
  parentDir,
  setParentDir,
  onBrowseParentDir,
  finalProjectPath,
  validationResult,
  isValidatingPath,
  onCopyPath,
  projectDescription,
  setProjectDescription,
  packageManager,
  setPackageManager,
  architecture,
  setArchitecture,
  initGit,
  setInitGit,
}) => {
  const categories: Array<{ id: ProjectTypeCategory; label: string; icon: any; desc: string }> = [
    { id: 'web', label: 'Web Applications', icon: Globe, desc: 'React, Next.js, Vue, Svelte, Astro' },
    { id: 'mobile', label: 'Mobile Apps', icon: Smartphone, desc: 'React Native, Expo, Flutter' },
    { id: 'backend', label: 'Backend APIs', icon: Server, desc: 'Express, FastAPI, NestJS, Go, Rust' },
    { id: 'fullstack', label: 'Full-Stack Solutions', icon: Zap, desc: 'Decoupled Client + Server Architectures' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Category Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Choose Project Domain</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {categories.map(c => {
            const Icon = c.icon;
            const isSelected = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="text-xs font-bold mt-1 text-slate-100">{c.label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{c.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name & Parent Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. taskflow-portal"
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200">Parent Directory Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={parentDir}
              onChange={e => setParentDir(e.target.value)}
              placeholder="/workspace/projects"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={onBrowseParentDir}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium shrink-0"
            >
              Browse...
            </button>
          </div>
        </div>
      </div>

      {/* Live Final Destination Preview & Conflict Checker */}
      <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs transition ${
        !validationResult.valid
          ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          : validationResult.warning
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
          : 'bg-slate-950 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[11px] text-slate-400">Target Filesystem Directory</span>
          {isValidatingPath && (
            <span className="text-[10px] text-indigo-400 animate-pulse flex items-center gap-1">
              <RotateCw className="w-3 h-3 animate-spin" /> Checking conflict...
            </span>
          )}
          {!isValidatingPath && validationResult.valid && !validationResult.warning && (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready on disk
            </span>
          )}
        </div>

        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="truncate">{finalProjectPath}</span>
          <button
            onClick={onCopyPath}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Copy path"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {!validationResult.valid && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1.5 pt-1 border-t border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{validationResult.error}</span>
          </p>
        )}

        {validationResult.warning && (
          <p className="text-[11px] text-amber-300 flex items-center gap-1.5 pt-1 border-t border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{validationResult.warning}</span>
          </p>
        )}
      </div>

      {/* Natural Language Prompt & Goal */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-200">
          Project Description & Architectural Requirements
        </label>
        <textarea
          value={projectDescription}
          onChange={e => setProjectDescription(e.target.value)}
          placeholder="Describe your requirements: e.g. Customer management portal with React 19, Tailwind, authentication, PostgreSQL database, and automated tests."
          className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 h-20 resize-none leading-relaxed"
        />
      </div>

      {/* Package Manager & Architecture Preference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400 font-semibold">Package Manager</label>
          <select
            value={packageManager}
            onChange={e => setPackageManager(e.target.value as PackageManager)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="npm">npm</option>
            <option value="pnpm">pnpm</option>
            <option value="yarn">yarn</option>
            <option value="bun">bun</option>
            <option value="pip">pip (Python)</option>
            <option value="cargo">cargo (Rust)</option>
            <option value="go">go (Go modules)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400 font-semibold">Architecture Pattern</label>
          <select
            value={architecture}
            onChange={e => setArchitecture(e.target.value as ArchitectureType)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="feature-based">Feature-Based (Recommended for scalability)</option>
            <option value="modular">Modular / Layered (Standard full-stack)</option>
            <option value="clean">Clean Architecture (Domain-driven)</option>
            <option value="simple">Simple / Minimal (Small apps & prototypes)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="initGitCheck"
            checked={initGit}
            onChange={e => setInitGit(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
          />
          <label htmlFor="initGitCheck" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Initialize Git Repository</span>
          </label>
        </div>
      </div>
    </div>
  );
};
