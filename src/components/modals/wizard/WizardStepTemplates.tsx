import React from 'react';
import { Layers, Check } from 'lucide-react';
import { TemplateDefinition } from '../../../types/scaffolding';

interface Props {
  filteredTemplates: TemplateDefinition[];
  availableTemplates: TemplateDefinition[];
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  templateSearch: string;
  setTemplateSearch: (q: string) => void;
  currentTemplate: TemplateDefinition | undefined;
  selectedLibraries: string[];
  onToggleLibrary: (libId: string) => void;
}

export const WizardStepTemplates: React.FC<Props> = ({
  filteredTemplates,
  availableTemplates,
  selectedTemplateId,
  setSelectedTemplateId,
  templateSearch,
  setTemplateSearch,
  currentTemplate,
  selectedLibraries,
  onToggleLibrary,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Select Technology Template</h3>
          <p className="text-[11px] text-slate-400">Production-validated stacks with functioning entry points and test configurations</p>
        </div>
        <span className="text-xs font-mono text-indigo-400">{filteredTemplates.length} of {availableTemplates.length} stacks</span>
      </div>

      {/* Template Search Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={templateSearch}
            onChange={e => setTemplateSearch(e.target.value)}
            placeholder="Search templates by framework, language, or stack (e.g. Next, React, Vue, FastAPI, Go, Rust, Flutter)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
          <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
        {templateSearch && (
          <button
            onClick={() => setTemplateSearch('')}
            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
        {filteredTemplates.map(t => {
          const isSelected = selectedTemplateId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTemplateId(t.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  {t.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                      {t.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>

              <div className="flex flex-wrap gap-1 mt-1">
                {t.frameworks.map((fw, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-md">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compatible Libraries / Add-ons */}
      {currentTemplate && currentTemplate.compatibleLibraries.length > 0 && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-300">Compatible Libraries & Tooling</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentTemplate.compatibleLibraries.map(lib => {
              const isChecked = selectedLibraries.includes(lib.id);
              return (
                <label
                  key={lib.id}
                  className="flex items-center gap-2.5 p-2 bg-slate-900/80 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleLibrary(lib.id)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{lib.name}</span>
                    <span className="text-[10px] text-slate-500">{lib.description}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
