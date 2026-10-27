import React from 'react';
import {
  FileText,
  Palette,
  Layers,
  Code2,
  ShieldCheck,
  Lock,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { AgentContractsTab } from './AgentContractsTab';
import { AgentQATab } from './AgentQATab';
import { AgentBriefTab } from './deliverables/AgentBriefTab';
import { AgentDesignTab } from './deliverables/AgentDesignTab';
import { AgentArchitectureTab } from './deliverables/AgentArchitectureTab';
import { AgentCodeTab } from './deliverables/AgentCodeTab';

export type AgentArtifactTabId = 'brief' | 'design' | 'architecture' | 'code' | 'qa' | 'contracts';

export interface AgentDeliverablesPanelProps {
  activeArtifactTab: AgentArtifactTabId;
  setActiveArtifactTab: (tab: AgentArtifactTabId) => void;
  activeProject: { name: string };
  tasks: any[];
  reports: any;
  testResults: any;
  failedTests: number;
  runTests: () => void;
  setActiveView?: (view: any) => void;
  triggerSelfHealDebug: () => void;
  vfs: Record<string, any>;
  openFile: (path: string) => void;
}

export const AgentDeliverablesPanel: React.FC<AgentDeliverablesPanelProps> = ({
  activeArtifactTab,
  setActiveArtifactTab,
  activeProject,
  tasks,
  reports,
  testResults,
  failedTests,
  runTests,
  triggerSelfHealDebug,
  vfs,
  openFile,
  setActiveView,
}) => {
  return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Deliverable Category Navigation Tabs */}
        <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 h-full shrink-0">
            <button
              onClick={() => setActiveArtifactTab('brief')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'brief'
                  ? 'border-indigo-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Product Brief & Scope (Product Designer)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('design')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'design'
                  ? 'border-cyan-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>UI Design Specs & Tokens (UI Designer)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('architecture')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'architecture'
                  ? 'border-amber-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>System Architecture & APIs (Lead Architect)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('code')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'code'
                  ? 'border-blue-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Frontend & Backend Contracts (Engineers)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('qa')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'qa'
                  ? 'border-emerald-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>QA Strategy & Self-Healing (QA Lead)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('contracts')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'contracts'
                  ? 'border-purple-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Contracts & File Locks ({tasks.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden xl:inline shrink-0 ml-2">
            Workspace: {activeProject.name}
          </span>
        </div>

        {/* Tab Content Panes */}
        <div className="p-6">
          {/* TAB 1: PRODUCT DESIGNER SPEC */}
          {activeArtifactTab === 'brief' && (
            <AgentBriefTab activeProject={activeProject} openFile={openFile} />
          )}

          {/* TAB 2: UI DESIGNER TOKENS & SPECS */}
          {activeArtifactTab === 'design' && (
            <AgentDesignTab setActiveView={setActiveView} />
          )}

          {/* TAB 3: LEAD ARCHITECT SYSTEM BLUEPRINT */}
          {activeArtifactTab === 'architecture' && (
            <AgentArchitectureTab openFile={openFile} />
          )}

          {/* TAB 4: FRONTEND & BACKEND CONTRACTS */}
          {activeArtifactTab === 'code' && (
            <AgentCodeTab vfs={vfs} openFile={openFile} />
          )}

          {/* TAB 5: QA & SELF-HEALING DEBUGGER */}
          {activeArtifactTab === 'qa' && (
            <AgentQATab
              testResults={testResults}
              failedTests={failedTests}
              runTests={runTests}
              triggerSelfHealDebug={triggerSelfHealDebug}
            />
          )}

          {/* TAB 6: CONTRACTS & FILE LOCKS */}
          {activeArtifactTab === 'contracts' && (
            <AgentContractsTab tasks={tasks} reports={reports} />
          )}
        </div>
      </div>
  );
};
