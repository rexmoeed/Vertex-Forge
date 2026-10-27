import React from 'react';
import { FileCode, CheckCircle2 } from 'lucide-react';

interface AgentBriefTabProps {
  activeProject: { name: string };
  openFile: (path: string) => void;
}

export const AgentBriefTab: React.FC<AgentBriefTabProps> = ({ activeProject, openFile }) => {
  return (
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
        {/* Product Purpose */}
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

        {/* User Journeys */}
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

        {/* Acceptance Criteria */}
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
  );
};
