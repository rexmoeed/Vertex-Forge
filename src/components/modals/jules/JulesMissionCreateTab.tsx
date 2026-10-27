import React from 'react';
import { Play, Clock, ArrowRight, Shield } from 'lucide-react';
import { JulesSource } from '../../../services/julesService';

interface JulesMissionCreateTabProps {
  sources: JulesSource[];
  selectedSource: string;
  setSelectedSource: (s: string) => void;
  selectedBranch: string;
  setSelectedBranch: (b: string) => void;
  missionTitle: string;
  setMissionTitle: (t: string) => void;
  missionPrompt: string;
  setMissionPrompt: (p: string) => void;
  requireApproval: boolean;
  setRequireApproval: (r: boolean) => void;
  isLoading: boolean;
  quickTemplates: Array<{ title: string; prompt: string }>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const JulesMissionCreateTab: React.FC<JulesMissionCreateTabProps> = ({
  sources,
  selectedSource,
  setSelectedSource,
  selectedBranch,
  setSelectedBranch,
  missionTitle,
  setMissionTitle,
  missionPrompt,
  setMissionPrompt,
  requireApproval,
  setRequireApproval,
  isLoading,
  quickTemplates,
  onSubmit,
  onClose,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Repository & Branch Select */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target GitHub Repository
          </label>
          <div className="relative">
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
              className="w-full text-xs text-white rounded-xl border px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {sources.map(src => (
                <option key={src.name} value={src.name}>
                  {src.githubRepo ? `${src.githubRepo.owner}/${src.githubRepo.repo}` : src.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Starting Base Branch
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                placeholder="main"
                style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
                className="w-full text-xs text-white rounded-xl border px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Mission Title (Optional)
        </label>
        <input
          type="text"
          value={missionTitle}
          onChange={e => setMissionTitle(e.target.value)}
          placeholder="e.g. Implement comprehensive end-to-end tests for billing API"
          style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
          className="w-full text-xs text-white rounded-xl border px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Preset Mission Templates */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Preset Mission Templates
        </label>
        <div className="grid grid-cols-2 gap-2">
          {quickTemplates.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMissionTitle(tmpl.title);
                setMissionPrompt(tmpl.prompt);
              }}
              style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
              className="text-left p-3 rounded-xl border hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group cursor-pointer"
            >
              <div className="text-xs font-semibold text-indigo-300 group-hover:text-indigo-200 flex items-center justify-between">
                <span>{tmpl.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                {tmpl.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions Textarea */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Agent Instructions & Acceptance Criteria
        </label>
        <textarea
          rows={5}
          value={missionPrompt}
          onChange={e => setMissionPrompt(e.target.value)}
          placeholder="Describe exactly what Google Jules should modify, test, and package into a Pull Request..."
          style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
          className="w-full text-xs text-white rounded-xl border p-3.5 focus:outline-none focus:border-indigo-500 transition-colors font-mono resize-none"
        />
      </div>

      {/* Plan Approval Toggle */}
      <div
        style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
        className="p-3.5 rounded-xl border flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Require Interactive Plan Approval</h4>
            <p className="text-[11px] text-slate-400">
              Jules will pause after formulation to let you review impacted files before writing any code.
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={requireApproval}
          onChange={e => setRequireApproval(e.target.checked)}
          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <Clock className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>Launch Jules Cloud Mission</span>
        </button>
      </div>
    </form>
  );
};
