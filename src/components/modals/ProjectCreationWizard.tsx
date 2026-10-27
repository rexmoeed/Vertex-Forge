import React from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  X,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useProjectCreationWizard } from '../../hooks/useProjectCreationWizard';
import { WizardStepDetails } from './wizard/WizardStepDetails';
import { WizardStepTemplates } from './wizard/WizardStepTemplates';
import { WizardStepArchitecture } from './wizard/WizardStepArchitecture';
import { WizardStepExecution } from './wizard/WizardStepExecution';
import { ArchitecturePlanner } from '../../services/architecturePlanner';

interface ProjectCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({ isOpen, onClose }) => {
  const { openLocalFolder, logAgentAction } = useIDE();
  const wiz = useProjectCreationWizard(logAgentAction, openLocalFolder);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        
        {/* Wizard Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>New Project Engine</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                  Production Scaffolder
                </span>
              </h2>
              <p className="text-xs text-slate-400">Filesystem-backed multi-stack architecture generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Navigation Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
              <span className={wiz.step === 1 ? 'text-indigo-400 font-bold' : wiz.step > 1 ? 'text-emerald-400' : ''}>1. Details</span>
              <span>&gt;</span>
              <span className={wiz.step === 2 ? 'text-indigo-400 font-bold' : wiz.step > 2 ? 'text-emerald-400' : ''}>2. Stack</span>
              <span>&gt;</span>
              <span className={wiz.step === 3 ? 'text-indigo-400 font-bold' : wiz.step > 3 ? 'text-emerald-400' : ''}>3. Architecture</span>
              <span>&gt;</span>
              <span className={wiz.step === 4 ? 'text-emerald-400 font-bold' : ''}>4. Scaffold</span>
            </div>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wizard Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {wiz.step === 1 && (
            <WizardStepDetails
              category={wiz.category}
              setCategory={wiz.setCategory}
              projectName={wiz.projectName}
              setProjectName={wiz.setProjectName}
              parentDir={wiz.parentDir}
              setParentDir={wiz.setParentDir}
              onBrowseParentDir={wiz.handleBrowseDirectory}
              finalProjectPath={wiz.finalProjectPath}
              validationResult={wiz.validationResult}
              isValidatingPath={wiz.isValidatingPath}
              onCopyPath={wiz.handleCopyPath}
              projectDescription={wiz.projectDescription}
              setProjectDescription={wiz.setProjectDescription}
              packageManager={wiz.packageManager}
              setPackageManager={wiz.setPackageManager}
              architecture={wiz.architecture}
              setArchitecture={wiz.setArchitecture}
              initGit={wiz.initGit}
              setInitGit={wiz.setInitGit}
            />
          )}

          {wiz.step === 2 && (
            <WizardStepTemplates
              filteredTemplates={wiz.filteredTemplates}
              availableTemplates={wiz.availableTemplates}
              selectedTemplateId={wiz.selectedTemplateId}
              setSelectedTemplateId={wiz.setSelectedTemplateId}
              templateSearch={wiz.templateSearch}
              setTemplateSearch={wiz.setTemplateSearch}
              currentTemplate={wiz.currentTemplate}
              selectedLibraries={wiz.selectedLibraries}
              onToggleLibrary={wiz.toggleLibrary}
            />
          )}

          {wiz.step === 3 && wiz.plan && (
            <WizardStepArchitecture
              plan={wiz.plan}
              plannedFiles={wiz.plannedFiles}
              onUpdateFiles={wiz.setPlannedFiles}
              onRevisePlan={instruction => {
                if (!wiz.plan) return;
                const ctx = wiz.buildContext();
                const revised = ArchitecturePlanner.revisePlan(wiz.plan, instruction, ctx);
                wiz.setPlan(revised);
                wiz.setPlannedFiles(revised.files);
              }}
              onResetToBlueprint={async () => {
                const ctx = wiz.buildContext();
                const freshPlan = await ArchitecturePlanner.planArchitecture(ctx);
                wiz.setPlan(freshPlan);
                wiz.setPlannedFiles(freshPlan.files);
              }}
            />
          )}

          {wiz.step === 4 && (
            <WizardStepExecution
              finalProjectPath={wiz.finalProjectPath}
              creationProgress={wiz.creationProgress}
              showLogs={wiz.showLogs}
              setShowLogs={wiz.setShowLogs}
              creationLogs={wiz.creationLogs}
              executionResult={wiz.executionResult}
              onRevealInExplorer={() => {
                wiz.setRevealNotice(true);
                setTimeout(() => wiz.setRevealNotice(false), 3000);
              }}
              onCopyPath={wiz.handleCopyPath}
              copiedPath={wiz.copiedPath}
              onOpenProject={() => wiz.handleOpenCreatedProject(onClose)}
              revealNotice={wiz.revealNotice}
            />
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {wiz.step > 1 && wiz.step < 4 ? (
            <button
              onClick={() => wiz.setStep((s: number) => (s - 1) as any)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Back
            </button>
          ) : <div />}

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              {wiz.step === 4 && wiz.executionResult?.success ? 'Close' : 'Cancel'}
            </button>

            {wiz.step === 1 && (
              <button
                onClick={() => {
                  if (wiz.validationResult.valid) wiz.setStep(2);
                }}
                disabled={!wiz.validationResult.valid || wiz.isValidatingPath}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
              >
                <span>Choose Stack & Template</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {wiz.step === 2 && (
              <>
                <button
                  type="button"
                  onClick={wiz.handleFastCreate}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Generate instantly with sensible defaults without reviewing folder tree"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fast Scaffold</span>
                </button>
                <button
                  type="button"
                  onClick={wiz.handleGeneratePlan}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition"
                >
                  <span>Plan Architecture</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {wiz.step === 3 && (
              <button
                onClick={wiz.handleExecuteCreation}
                className="px-5 py-1.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Project on Disk</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
