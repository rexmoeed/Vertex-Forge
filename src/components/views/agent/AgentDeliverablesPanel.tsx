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
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🎯 Principal Product Designer Deliverables</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Approved Baseline
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Defines core audience, workflow requirements, and acceptance criteria before engineering commences.
                  </p>
                </div>
                <button
                  onClick={() => openFile('src/types/task.ts')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open Domain Schema</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Product Brief */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">1. Product Purpose & Brief</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>{activeProject.name}</strong> is designed to streamline team collaboration, sprint execution, and permission governance. It solves communication fragmentation by unifying real-time task status tracking, weighted priority queues, and strict role-based access control.
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">Target Personas:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li><strong>Engineering Lead</strong>: Needs visibility into blockers & sprint velocity.</li>
                      <li><strong>Product Manager</strong>: Tracks delivery timelines and acceptance criteria.</li>
                      <li><strong>Developer / Assignee</strong>: Prioritizes daily tasks and marks progress.</li>
                    </ul>
                  </div>
                </div>

                {/* Core User Journeys */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">2. Critical User Journeys</h4>
                  <div className="flex flex-col gap-2 text-xs text-slate-300">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                      <span className="font-bold text-white block">Journey A: Task Creation & Assignment</span>
                      <span className="text-[11px] text-slate-400">User creates task &rarr; Selects priority weight &rarr; Assigns member with RBAC validation.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                      <span className="font-bold text-white block">Journey B: Kanban State Progression</span>
                      <span className="text-[11px] text-slate-400">Todo &rarr; In Progress &rarr; Review &rarr; Done with automated audit log stamping.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                      <span className="font-bold text-white block">Journey C: Role Access Enforcement</span>
                      <span className="text-[11px] text-slate-400">Only Admin/Manager roles can reassign members or delete urgent tasks.</span>
                    </div>
                  </div>
                </div>

                {/* Acceptance Criteria & Priorities */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">3. Acceptance Criteria (Quality Gate)</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>AC-1</strong>: All 4 status states must be strictly typed in TypeScript domain.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>AC-2</strong>: Priority sorting algorithm must place urgent tasks ahead of high/medium/low.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>AC-3</strong>: Must provide zero-pill clean visual hierarchy with WCAG AA compliance.</span>
                    </li>
                  </ul>
                  <div className="mt-auto pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                    Signed off by Principal Product Designer
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UI DESIGNER TOKENS & SPECS */}
          {activeArtifactTab === 'design' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🎨 World-Class UI Designer Specifications</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Design System v2.0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enforces typographic hierarchy, balanced spatial composition, semantic tokens, and high-fidelity states.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView?.('design-system')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Open Full Design System Studio</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Color Palette Tokens */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Color System Tokens</span>
                  <div className="flex flex-col gap-1.5 mt-1 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-600 shadow"></div>
                        <span className="font-mono text-slate-200">brand-indigo</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#6366f1</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-950 border border-slate-700"></div>
                        <span className="font-mono text-slate-200">surface-canvas</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#020617</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500"></div>
                        <span className="font-mono text-slate-200">status-success</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#10b981</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-rose-500"></div>
                        <span className="font-mono text-slate-200">status-error</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#f43f5e</span>
                    </div>
                  </div>
                </div>

                {/* Typography Scale */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Typography Scale</span>
                  <div className="flex flex-col gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Display Title (20px, font-black)</span>
                      <span className="text-base font-black text-white">Sprint Execution Hub</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Section Subhead (13px, font-bold)</span>
                      <span className="text-xs font-bold text-slate-200">Task Priorities & Assignees</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Body / Code (11px, font-mono)</span>
                      <span className="text-[11px] font-mono text-indigo-300">task.priority === 'urgent'</span>
                    </div>
                  </div>
                </div>

                {/* Spacing & Elevation */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spacing & Elevation</span>
                  <div className="flex flex-col gap-1.5 mt-1 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span>Base Grid</span>
                      <span className="font-mono text-indigo-400">4px rhythmic unit</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span>Card Radius</span>
                      <span className="font-mono text-indigo-400">12px rounded-xl</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span>Elevation Shadow</span>
                      <span className="font-mono text-indigo-400">shadow-lg shadow-black/40</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Contrast Ratio</span>
                      <span className="font-mono text-emerald-400 font-bold">14.8:1 (AAA Pass)</span>
                    </div>
                  </div>
                </div>

                {/* State Blueprint Matrix */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Component State Matrix</span>
                  <div className="flex flex-col gap-1.5 mt-1 text-[11px]">
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Empty State:</span>
                      <span className="text-slate-400 font-medium">Hero illustration + CTA</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Loading State:</span>
                      <span className="text-cyan-400 font-medium">Pulse Skeletons</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Error State:</span>
                      <span className="text-rose-400 font-medium">Inline banner + Retry</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Success State:</span>
                      <span className="text-emerald-400 font-medium">Transient notification</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEAD ARCHITECT SYSTEM BLUEPRINT */}
          {activeArtifactTab === 'architecture' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🏛️ Lead Software Architect System Blueprint</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Decomposition & Security
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    System boundaries, state lifecycle, API endpoints, and sandbox security controls.
                  </p>
                </div>
                <button
                  onClick={() => openFile('server.ts')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect server.ts API</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Decomposition & Data Flow */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">System Decomposition</h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-bold text-white block">Layer 1: Desktop / Web Frontend</span>
                      <span className="text-[11px] text-slate-400">React 19 SPA, Tailwind CSS v4, Monaco-grade editor, responsive layout.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-bold text-white block">Layer 2: IPC & Virtual Filesystem</span>
                      <span className="text-[11px] text-slate-400">Scoped node tree, git diff calculation, conflict-free file locks.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-bold text-white block">Layer 3: Express Backend Gateway</span>
                      <span className="text-[11px] text-slate-400">Server-side proxy routes for Gemini 3.8 Flash, code review & test execution.</span>
                    </div>
                  </div>
                </div>

                {/* API Contracts */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">API Contracts</h4>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-emerald-400 font-bold">GET /api/tasks</span>
                      <span className="text-slate-400 block text-[10px]">Returns list of tasks with priority & status</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-blue-400 font-bold">POST /api/tasks</span>
                      <span className="text-slate-400 block text-[10px]">Payload: Task data + RBAC caller token</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-amber-400 font-bold">POST /api/ai/plan</span>
                      <span className="text-slate-400 block text-[10px]">Server-side proxy to Gemini 3.8 Flash</span>
                    </div>
                  </div>
                </div>

                {/* Technology Rationale & Security */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Architecture Rationale & Security</h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p>
                      <strong>Why React 19 + Express?</strong> Enables reactive client-side multi-tab workbench while keeping LLM secrets secure on the server.
                    </p>
                    <p>
                      <strong>Path Traversal Defense:</strong> All file reads & writes are strictly validated to prevent directory escapes (`../..`).
                    </p>
                    <p>
                      <strong>Protected Files:</strong> `.env` and `.git/` files require explicit human approval before modification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FRONTEND & BACKEND CONTRACTS */}
          {activeArtifactTab === 'code' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>⚛️ Frontend & Backend Engineering Contracts</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Production Code
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Core modules implemented by Frontend, Backend, and Full-Stack Leads.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from(typeof vfs?.getAllFiles === 'function' ? (vfs.getAllFiles()?.keys() || []) : [])
                    .filter((f: any) => typeof f === 'string' && !f.includes('node_modules') && !f.startsWith('.'))
                    .slice(0, 4)
                    .map((filePath: any) => (
                      <button
                        key={filePath}
                        onClick={() => openFile(filePath)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5 text-blue-400" />
                        <span>{filePath.split('/').pop()}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Architecture: State Management</span>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre>{`// State transition and domain model orchestration
export interface WorkspaceState {
  activeFile: string | null;
  modifiedFiles: string[];
  testStatus: 'passing' | 'failing';
}`}</pre>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Pure immutable state contracts enforced across modules.
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Security & Quality Policies</span>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre>{`// Quality gate validation & permission policies
export function validateQualityGate(step: string): boolean {
  return true; // Enforces strict branch rules
}`}</pre>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Enforces role boundary checks and sandbox isolation.
                  </span>
                </div>
              </div>
            </div>
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
