import React from 'react';
import { Cpu } from 'lucide-react';
import { ArchitecturePlan, PlannedFileItem } from '../../../types/scaffolding';
import { ProjectStructureEditor } from '../ProjectStructureEditor';

interface Props {
  plan: ArchitecturePlan;
  plannedFiles: PlannedFileItem[];
  onUpdateFiles: (files: PlannedFileItem[]) => void;
  onRevisePlan: (instruction: string) => void;
  onResetToBlueprint: () => void;
}

export const WizardStepArchitecture: React.FC<Props> = ({
  plan,
  plannedFiles,
  onUpdateFiles,
  onRevisePlan,
  onResetToBlueprint,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Architecture Summary Banner */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Architectural Blueprint
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-bold uppercase">
            {plan.complexity} Scale
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">{plan.summary}</p>
        <p className="text-[11px] text-slate-400 italic">{plan.rationale}</p>

        {/* Boundaries Map */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
          {plan.boundaries.frontend && (
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Frontend Boundary</span>
              <span className="text-slate-300 font-mono text-[10px]">{plan.boundaries.frontend}</span>
            </div>
          )}
          {plan.boundaries.backend && (
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Backend Boundary</span>
              <span className="text-slate-300 font-mono text-[10px]">{plan.boundaries.backend}</span>
            </div>
          )}
          {plan.boundaries.authentication && (
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Authentication</span>
              <span className="text-slate-300 font-mono text-[10px]">{plan.boundaries.authentication}</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Structure Editor */}
      <ProjectStructureEditor
        files={plannedFiles}
        plan={plan}
        onUpdateFiles={onUpdateFiles}
        onRevisePlan={onRevisePlan}
        onResetToRecommended={onResetToBlueprint}
      />
    </div>
  );
};
